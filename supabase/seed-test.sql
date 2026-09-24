-- ONLY in a dedicated test project or isolated development branch.
-- Never apply this seed to the deployed SLICER database.
do $$ begin if exists(select 1 from store_settings where live_enabled) then raise exception 'Test seed prohibited in live mode';end if;end $$;
update variants set stock=case size when 'S' then 10 when 'M' then 15 when 'L' then 15 when 'XL' then 10 end,inventory_verified=false
where product_id=(select id from products where slug='bloom-flow-02') and reserved=0;
