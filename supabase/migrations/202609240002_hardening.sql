create schema if not exists private;
alter function public.is_admin() set schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated,service_role;
revoke execute on function private.is_admin() from public,anon;
grant execute on function private.is_admin() to authenticated,service_role;
alter table store_settings add column legal_copy text, add column privacy_copy text, add column terms_copy text;
alter table store_settings add constraint live_content_required check(not live_enabled or (
legal_verified and tax_verified and shipping_verified and length(coalesce(legal_copy,''))>100 and length(coalesce(privacy_copy,''))>100 and length(coalesce(terms_copy,''))>100 and length(coalesce(shipping_copy,''))>20 and length(coalesce(returns_copy,''))>20));
insert into images(product_id,url,alt,position) select id,'/images/detail.webp','BLOOM FLOW 02 — détail conceptuel de la rose',2 from products where slug='bloom-flow-02';
create or replace function public.record_refund(p_event text,p_intent text,p_refunded integer) returns void language plpgsql security definer set search_path=public as $$
declare p payments%rowtype;v_refunded integer;begin
insert into stripe_events(id) values(p_event) on conflict do nothing;if not found then return;end if;
select * into p from payments where id=p_intent for update;if not found then raise exception 'Unknown payment';end if;
v_refunded:=greatest(p.refunded,p_refunded);
if v_refunded<0 or v_refunded>p.amount then raise exception 'Invalid refund';end if;
update payments set refunded=v_refunded,status=case when v_refunded>=amount then 'refunded' else 'partially_refunded' end where id=p_intent;
update orders set status=case when v_refunded>=p.amount then 'refunded' else 'partially_refunded' end where id=p.order_id;end $$;
