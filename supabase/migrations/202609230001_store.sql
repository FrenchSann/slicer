create extension if not exists pgcrypto;
create table public.administrators(user_id uuid primary key references auth.users(id) on delete cascade);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from administrators where user_id=auth.uid()) $$;
create table public.products(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,description text not null default '',composition text not null default '',active boolean not null default false,created_at timestamptz not null default now());
create table public.variants(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id),size text not null,price integer not null check(price>0),currency text not null default 'eur' check(currency='eur'),stock integer not null default 0 check(stock>=0),reserved integer not null default 0 check(reserved>=0 and reserved<=stock),preorder boolean not null default false,preorder_limit integer not null default 0 check(preorder_limit>=0),preorder_reserved integer not null default 0 check(preorder_reserved>=0 and preorder_reserved<=preorder_limit),inventory_verified boolean not null default false,unique(product_id,size));
create table public.images(id uuid primary key default gen_random_uuid(),product_id uuid not null references products(id),url text not null,alt text not null,position integer not null default 0);
create table public.store_settings(id integer primary key check(id=1),seller_name text,seller_address text,seller_registration text,contact_email text,legal_verified boolean not null default false,tax_verified boolean not null default false,shipping_verified boolean not null default false,shipping_copy text,returns_copy text,live_enabled boolean not null default false);
insert into store_settings(id) values(1);
create table public.shipping_rates(country text primary key,amount integer not null check(amount>=0),enabled boolean not null default false);
create table public.orders(id uuid primary key default gen_random_uuid(),status text not null default 'pending' check(status in ('pending','paid','expired','refunded','partially_refunded')),email text,country text not null,currency text not null default 'eur',total integer not null default 0,shipping integer not null,session_id text unique,payment_intent text unique,token_hash text not null unique,expires_at timestamptz not null,created_at timestamptz not null default now(),paid_at timestamptz,shipping_address jsonb,mode text not null check(mode in ('test','live')),checkout_payload jsonb);
create table public.order_lines(id uuid primary key default gen_random_uuid(),order_id uuid not null references orders(id),variant_id uuid not null references variants(id),name text not null,size text not null,unit_price integer not null,quantity integer not null check(quantity>0),preorder boolean not null default false);
create table public.payments(id text primary key,order_id uuid not null references orders(id),amount integer not null,currency text not null,status text not null,refunded integer not null default 0);
create table public.stripe_events(id text primary key,created_at timestamptz not null default now());
create table public.shipments(order_id uuid primary key references orders(id),status text not null default 'preparing' check(status in ('preparing','shipped','delivered')),tracking_number text,carrier text,updated_at timestamptz not null default now());
create table public.newsletter(id uuid primary key default gen_random_uuid(),email text not null unique,status text not null default 'pending' check(status in ('pending','subscribed','unsubscribed')),token_hash text not null,consent_text text not null,consent_at timestamptz not null default now(),confirmed_at timestamptz);
create table public.contact_messages(id uuid primary key default gen_random_uuid(),email text not null,message text not null,created_at timestamptz not null default now());
create table public.email_outbox(id uuid primary key default gen_random_uuid(),dedupe_key text unique not null,recipient text not null,subject text not null,body text not null,attempts integer not null default 0,next_attempt_at timestamptz not null default now(),locked_until timestamptz,sent_at timestamptz,last_error text);
create table public.rate_limits(key text primary key,hits integer not null default 1,reset_at timestamptz not null);
create index on order_lines(order_id);
create index on order_lines(variant_id);
create index on variants(product_id);
create index on images(product_id);
create index on orders(status,expires_at);
create index on payments(order_id);
create index on email_outbox(next_attempt_at) where sent_at is null;
do $$ declare t text; begin foreach t in array array['administrators','products','variants','images','store_settings','shipping_rates','orders','order_lines','payments','stripe_events','shipments','newsletter','contact_messages','email_outbox','rate_limits'] loop execute format('alter table public.%I enable row level security',t);execute format('create policy admin_all on public.%I for all to authenticated using(public.is_admin()) with check(public.is_admin())',t);end loop; end $$;
create policy catalog_public on products for select to anon,authenticated using(active);
create policy variants_public on variants for select to anon,authenticated using(exists(select 1 from products where products.id=product_id and active));
create policy images_public on images for select to anon,authenticated using(exists(select 1 from products where products.id=product_id and active));
create policy settings_public on store_settings for select to anon,authenticated using(true);
create policy shipping_public on shipping_rates for select to anon,authenticated using(enabled);
create policy admin_self on administrators for select to authenticated using(user_id=auth.uid());
create function public.consume_rate(p_key text,p_limit integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public as $$
declare n integer;begin
insert into rate_limits(key,reset_at) values(p_key,now()+make_interval(secs=>p_seconds))
on conflict(key) do update set hits=case when rate_limits.reset_at<now() then 1 else rate_limits.hits+1 end,reset_at=case when rate_limits.reset_at<now() then now()+make_interval(secs=>p_seconds) else rate_limits.reset_at end returning hits into n;
return n<=p_limit;end $$;
create function public.reserve_order(p_items jsonb,p_country text,p_hash text,p_mode text) returns uuid language plpgsql security definer set search_path=public as $$
declare oid uuid; ship integer; item record; v variants%rowtype; pname text; subtotal integer:=0; settings store_settings%rowtype;
begin
if p_mode not in ('test','live') or jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 then raise exception 'Invalid cart';end if;
if p_country<>all(array['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK']) then raise exception 'Invalid country';end if;
select * into settings from store_settings where id=1;
if p_mode='live' and not(settings.live_enabled and settings.legal_verified and settings.tax_verified and settings.shipping_verified and coalesce(settings.seller_name,'')<>'' and coalesce(settings.seller_address,'')<>'' and coalesce(settings.seller_registration,'')<>'' and coalesce(settings.contact_email,'')<>'' and coalesce(settings.returns_copy,'')<>'') then raise exception 'Sales closed';end if;
select amount into ship from shipping_rates where country=p_country and enabled;
if ship is null then if p_mode='test' then ship:=500;else raise exception 'Shipping unavailable';end if;end if;
insert into orders(country,shipping,token_hash,expires_at,mode) values(p_country,ship,p_hash,now()+interval '30 minutes',p_mode) returning id into oid;
for item in select x.id,sum(x.quantity)::integer quantity from jsonb_to_recordset(p_items) as x(id uuid,quantity integer) group by x.id order by x.id loop
if item.quantity is null or item.quantity<1 or item.quantity>10 then raise exception 'Invalid quantity';end if;
select * into v from variants where id=item.id for update;
if not found then raise exception 'Invalid variant';end if;
select name into pname from products where id=v.product_id and active;
if pname is null or (p_mode='live' and not v.inventory_verified) then raise exception 'Unavailable';end if;
if v.preorder then
if v.preorder_limit-v.preorder_reserved<item.quantity then raise exception 'Insufficient stock';end if;
update variants set preorder_reserved=preorder_reserved+item.quantity where id=v.id;
else
if v.stock-v.reserved<item.quantity then raise exception 'Insufficient stock';end if;
update variants set reserved=reserved+item.quantity where id=v.id;
end if;
insert into order_lines(order_id,variant_id,name,size,unit_price,quantity,preorder) values(oid,v.id,pname,v.size,v.price,item.quantity,v.preorder);
subtotal:=subtotal+v.price*item.quantity;
end loop;
update orders set total=subtotal+ship where id=oid;return oid;end $$;
create function public.apply_checkout_event(p_event text,p_order uuid,p_session text,p_kind text,p_amount integer,p_currency text,p_email text,p_intent text,p_address jsonb,p_mail text) returns void language plpgsql security definer set search_path=public as $$
declare o orders%rowtype;l record;
begin
insert into stripe_events(id) values(p_event) on conflict do nothing;if not found then return;end if;
select * into o from orders where id=p_order for update;if not found then raise exception 'Unknown order';end if;
if o.session_id is not null and o.session_id<>p_session then raise exception 'Session mismatch';end if;
if p_kind='paid' then
if o.total<>p_amount or o.currency<>p_currency then raise exception 'Amount mismatch';end if;
if o.status='paid' or o.status in ('refunded','partially_refunded') then return;end if;
if o.status<>'pending' then raise exception 'Invalid paid transition';end if;
for l in select * from order_lines where order_id=o.id order by variant_id loop
if l.preorder then update variants set preorder_reserved=preorder_reserved-l.quantity,preorder_limit=preorder_limit-l.quantity where id=l.variant_id;
else update variants set reserved=reserved-l.quantity,stock=stock-l.quantity where id=l.variant_id;end if;end loop;
update orders set status='paid',session_id=p_session,payment_intent=p_intent,email=p_email,shipping_address=p_address,paid_at=now(),checkout_payload=null where id=o.id;
insert into payments(id,order_id,amount,currency,status) values(p_intent,o.id,p_amount,p_currency,'paid');
insert into shipments(order_id) values(o.id) on conflict do nothing;
insert into email_outbox(dedupe_key,recipient,subject,body) values('paid:'||o.id,p_email,'SLICER — confirmation de commande',p_mail) on conflict do nothing;
elsif p_kind='expired' then
if o.status<>'pending' then return;end if;
for l in select * from order_lines where order_id=o.id order by variant_id loop
if l.preorder then update variants set preorder_reserved=preorder_reserved-l.quantity where id=l.variant_id;else update variants set reserved=reserved-l.quantity where id=l.variant_id;end if;end loop;
update orders set status='expired',session_id=coalesce(session_id,p_session),checkout_payload=null where id=o.id;
end if;end $$;
create function public.record_refund(p_event text,p_intent text,p_refunded integer) returns void language plpgsql security definer set search_path=public as $$
declare p payments%rowtype;begin insert into stripe_events(id) values(p_event) on conflict do nothing;if not found then return;end if;select * into p from payments where id=p_intent for update;if not found then raise exception 'Unknown payment';end if;update payments set refunded=greatest(refunded,p_refunded),status=case when greatest(refunded,p_refunded)>=amount then 'refunded' else 'partially_refunded' end where id=p_intent;update orders set status=case when p_refunded>=p.amount then 'refunded' else 'partially_refunded' end where id=p.order_id;end $$;
create function public.claim_emails() returns setof email_outbox language sql security definer set search_path=public as $$
update email_outbox set locked_until=now()+interval '5 minutes',attempts=attempts+1 where id in(select id from email_outbox where sent_at is null and next_attempt_at<=now() and (locked_until is null or locked_until<now()) order by next_attempt_at limit 20 for update skip locked) returning * $$;
revoke execute on function public.reserve_order(jsonb,text,text,text),public.apply_checkout_event(text,uuid,text,text,integer,text,text,text,jsonb,text),public.record_refund(text,text,integer),public.claim_emails(),public.consume_rate(text,integer,integer) from public,anon,authenticated;
grant execute on function public.reserve_order(jsonb,text,text,text),public.apply_checkout_event(text,uuid,text,text,integer,text,text,text,jsonb,text),public.record_refund(text,text,integer),public.claim_emails(),public.consume_rate(text,integer,integer) to service_role;
insert into products(slug,name,description,composition,active) values('bloom-flow-02','BLOOM FLOW 02','Une rose en mouvement. Une ligne précise. Le rashguard SLICER fait entrer un nouvel équilibre sur le tapis.','80 % polyester · 20 % élasthanne',true);
insert into variants(product_id,size,price) select p.id,s,4500 from products p cross join unnest(array['S','M','L','XL']) s where p.slug='bloom-flow-02';
insert into images(product_id,url,alt,position) select id,'/images/front.webp','BLOOM FLOW 02 — concept face',0 from products where slug='bloom-flow-02';
insert into images(product_id,url,alt,position) select id,'/images/back.webp','BLOOM FLOW 02 — concept dos',1 from products where slug='bloom-flow-02';
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('products','products',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
create policy product_images_read on storage.objects for select using(bucket_id='products');
create policy product_images_admin on storage.objects for all to authenticated using(bucket_id='products' and public.is_admin()) with check(bucket_id='products' and public.is_admin());
