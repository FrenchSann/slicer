begin;
do $$
declare v uuid;o uuid;counted integer;other uuid;
begin
select id into v from variants where size='S' limit 1;
update variants set stock=1,inventory_verified=false where id=v;
o:=reserve_order(jsonb_build_array(jsonb_build_object('id',v,'quantity',1)),'FR','test-hash-a','test');
begin
other:=reserve_order(jsonb_build_array(jsonb_build_object('id',v,'quantity',1)),'FR','test-hash-b','test');
raise exception 'TEST FAILED: oversell permitted';
exception when others then if SQLERRM not like '%Insufficient stock%' then raise;end if;end;
perform apply_checkout_event('evt-test-1',o,'cs_test_fixture','paid',5000,'eur','fixture@example.invalid','pi_test_fixture','{}','test');
perform apply_checkout_event('evt-test-1',o,'cs_test_fixture','paid',5000,'eur','fixture@example.invalid','pi_test_fixture','{}','test');
select stock into counted from variants where id=v;if counted<>0 then raise exception 'TEST FAILED: stock';end if;
select count(*) into counted from email_outbox where dedupe_key='paid:'||o;if counted<>1 then raise exception 'TEST FAILED: email duplication';end if;
perform record_refund('evt-refund', 'pi_test_fixture',5000);
select stock into counted from variants where id=v;if counted<>0 then raise exception 'TEST FAILED: refund restock';end if;
update variants set stock=1 where id=v;
o:=reserve_order(jsonb_build_array(jsonb_build_object('id',v,'quantity',1)),'FR','test-hash-c','test');
perform apply_checkout_event('evt-expiry',o,'cs_expiry_fixture','expired',0,'eur','','','{}','');
perform apply_checkout_event('evt-expiry',o,'cs_expiry_fixture','expired',0,'eur','','','{}','');
select reserved into counted from variants where id=v;if counted<>0 then raise exception 'TEST FAILED: reservation not released';end if;
begin
other:=reserve_order(jsonb_build_array(jsonb_build_object('id',v,'quantity',1)),'FR','test-hash-live','live');
raise exception 'TEST FAILED: live opened';
exception when others then if SQLERRM not like '%Sales closed%' then raise;end if;end;
end $$;
rollback;
select 'stock, duplicate webhook, refund, expiration and live gate tests passed' as result;
