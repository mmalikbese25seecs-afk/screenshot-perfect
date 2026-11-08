
-- ============ Promo validation (preview + used by place_order) ============
create or replace function public.validate_promo(p_code text)
returns table(code text, discount_type text, discount_value numeric)
language plpgsql stable security definer set search_path = public as $$
declare
  p public.promo_codes%rowtype;
begin
  select * into p from public.promo_codes where upper(promo_codes.code) = upper(trim(p_code));
  if not found or not p.active then
    raise exception 'PC: That promo code is invalid or has expired.';
  end if;
  if p.expires_at is not null and p.expires_at < now() then
    raise exception 'PC: That promo code is invalid or has expired.';
  end if;
  if p.usage_limit is not null and p.usage_count >= p.usage_limit then
    raise exception 'PC: That promo code has reached its usage limit.';
  end if;
  return query select p.code, p.discount_type, p.discount_value;
end;
$$;
grant execute on function public.validate_promo(text) to anon;
grant execute on function public.validate_promo(text) to authenticated;

-- ============ Place order (authoritative server-side pricing) ============
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_payment text,
  p_source text,
  p_notes text default null,
  p_transaction_id text default null,
  p_promo_code text default null,
  p_manual_discount_percent numeric default 0,
  p_items jsonb default '[]',
  p_idempotency_key text default null
)
returns table(order_number text, subtotal numeric, discount numeric, delivery_fee numeric, tax numeric, total numeric)
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_item jsonb;
  v_product public.products%rowtype;
  v_addon record;
  v_line_price numeric;
  v_line_addons jsonb;
  v_qty integer;
  v_subtotal numeric := 0;
  v_discount numeric := 0;
  v_delivery numeric := 0;
  v_tax numeric := 0;
  v_total numeric;
  v_promo record;
  v_order_id uuid;
  v_order_number text;
  v_settings public.store_settings%rowtype;
  v_settings_found boolean := false;
  v_existing record;
begin
  -- Duplicate submission guard
  if p_idempotency_key is not null then
    select o.order_number, o.subtotal, o.discount, o.delivery_fee, o.tax, o.total
      into v_existing from public.orders o where o.idempotency_key = p_idempotency_key;
    if found then
      return query select v_existing.order_number, v_existing.subtotal, v_existing.discount, v_existing.delivery_fee, v_existing.tax, v_existing.total;
      return;
    end if;
  end if;

  -- Blocked customers cannot order
  if v_uid is not null and exists (select 1 from public.profiles where id = v_uid and is_blocked) then
    raise exception 'PC: This account cannot place orders. Please contact the restaurant.';
  end if;

  select * into v_settings from public.store_settings where id = 1;
  v_settings_found := found;

  -- Store must be accepting orders (POS staff may override)
  if v_settings_found and not v_settings."acceptingOrders" and not public.is_staff(v_uid) then
    raise exception 'PC: We are not accepting orders right now. Please try again later.';
  end if;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'PC: Your order is empty.';
  end if;
  if p_payment not in ('cod','easypaisa','jazzcash') then
    raise exception 'PC: That payment method is not available.';
  end if;
  if p_source not in ('online','pos') then
    raise exception 'PC: Invalid order source.';
  end if;
  if p_source = 'pos' and not public.is_staff(v_uid) then
    raise exception 'PC: Only staff can create counter orders.';
  end if;

  -- Price every line from the database, never from the client
  create temporary table if not exists _pc_lines (name text, qty integer, price numeric, product_id uuid, addons jsonb) on commit drop;
  delete from _pc_lines;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(50, (v_item->>'qty')::integer));
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    if not found or not v_product.is_available then
      raise exception 'PC: One of the items in your order is no longer available.';
    end if;
    v_line_price := v_product.price;
    v_line_addons := '[]'::jsonb;
    if v_item ? 'addon_ids' and jsonb_array_length(coalesce(v_item->'addon_ids', '[]'::jsonb)) > 0 then
      for v_addon in
        select a.id, a.name, a.price from public.add_ons a
        where a.id in (select (value::text)::uuid from jsonb_array_elements_text(v_item->'addon_ids') as value)
          and a.is_active
      loop
        v_line_price := v_line_price + v_addon.price;
        v_line_addons := v_line_addons || jsonb_build_array(jsonb_build_object('id', v_addon.id, 'name', v_addon.name, 'price', v_addon.price));
      end loop;
    end if;
    insert into _pc_lines values (v_product.name, v_qty, v_line_price, v_product.id, v_line_addons);
  end loop;
  select coalesce(sum(price * qty), 0) into v_subtotal from _pc_lines;

  -- Minimum order
  if v_settings_found and v_settings."minOrder" is not null and v_subtotal < v_settings."minOrder" then
    raise exception 'PC: The minimum order amount is %.', v_settings."minOrder";
  end if;

  -- Promo code discount (re-validated here; the frontend preview is not trusted)
  if p_promo_code is not null and trim(p_promo_code) <> '' then
    select pc.code, pc.discount_type, pc.discount_value into v_promo from public.validate_promo(p_promo_code) pc;
    if v_promo.discount_type = 'percent' then
      v_discount := round(v_subtotal * v_promo.discount_value / 100, 2);
    else
      v_discount := least(v_promo.discount_value, v_subtotal);
    end if;
  end if;

  -- Manual POS discount: staff only, capped at 50%
  if coalesce(p_manual_discount_percent, 0) > 0 then
    if not public.is_staff(v_uid) then
      raise exception 'PC: Manual discounts can only be applied by staff.';
    end if;
    v_discount := v_discount + round(v_subtotal * least(p_manual_discount_percent, 50) / 100, 2);
  end if;

  -- Delivery fee and tax from published settings (unconfigured = 0)
  if v_settings_found then
    v_delivery := coalesce(v_settings."deliveryFee", 0);
    v_tax := round(greatest(v_subtotal - v_discount, 0) * coalesce(v_settings."taxRate", 0) / 100, 2);
  end if;
  v_total := greatest(v_subtotal - v_discount, 0) + v_delivery + v_tax;

  v_order_number := 'PC-' || lpad(nextval('public.order_number_seq')::text, 5, '0');

  insert into public.orders (
    order_number, customer_id, customer_name, phone, address, notes,
    transaction_id, promo_code, subtotal, discount, delivery_fee, tax, total,
    status, source, payment, payment_status, idempotency_key
  ) values (
    v_order_number, v_uid, trim(p_customer_name), nullif(trim(p_phone), ''), nullif(trim(p_address), ''), nullif(trim(p_notes), ''),
    nullif(trim(p_transaction_id), ''), nullif(upper(trim(p_promo_code)), ''), v_subtotal, v_discount, v_delivery, v_tax, v_total,
    'pending', p_source, p_payment, 'unpaid', p_idempotency_key
  ) returning id into v_order_id;

  insert into public.order_items (order_id, name, qty, price, product_id, addons)
  select v_order_id, l.name, l.qty, l.price, l.product_id, l.addons from _pc_lines l;

  -- Count promo usage
  if p_promo_code is not null and trim(p_promo_code) <> '' then
    update public.promo_codes set usage_count = usage_count + 1 where upper(code) = upper(trim(p_promo_code));
  end if;

  return query select v_order_number, v_subtotal, v_discount, v_delivery, v_tax, v_total;
end;
$$;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, numeric, jsonb, text) to anon;
grant execute on function public.place_order(text, text, text, text, text, text, text, text, numeric, jsonb, text) to authenticated;

-- ============ Track one order (owner, staff, or phone match) ============
create or replace function public.track_order(p_order_number text, p_phone text default null)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_uid uuid := auth.uid();
begin
  select * into v_order from public.orders where upper(order_number) = upper(trim(p_order_number));
  if not found then return null; end if;

  if not (
    (v_uid is not null and (v_order.customer_id = v_uid or public.is_staff(v_uid)))
    or (p_phone is not null and v_order.phone is not null and v_order.phone = trim(p_phone))
  ) then
    return null;
  end if;

  return to_jsonb(v_order) || jsonb_build_object(
    'order_items', coalesce((
      select jsonb_agg(jsonb_build_object('name', i.name, 'qty', i.qty, 'price', i.price, 'product_id', i.product_id, 'addons', i.addons))
      from public.order_items i where i.order_id = v_order.id
    ), '[]'::jsonb)
  );
end;
$$;
grant execute on function public.track_order(text, text) to anon;
grant execute on function public.track_order(text, text) to authenticated;

-- ============ Activity logging ============
create or replace function public.log_activity(p_action text, p_target text default '', p_module text default 'general', p_level text default 'info')
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  select coalesce(name, email) into v_name from public.profiles where id = auth.uid();
  insert into public.activity_logs (actor_id, actor_name, action, target, module, level)
  values (auth.uid(), coalesce(v_name, ''), p_action, p_target, p_module, coalesce(p_level, 'info'));
end;
$$;
grant execute on function public.log_activity(text, text, text, text) to authenticated;

-- ============ Staff message to a customer (lands in their notifications) ============
create or replace function public.send_customer_message(p_customer_id uuid, p_body text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'PC: Only staff can message customers.';
  end if;
  if not exists (select 1 from public.profiles where id = p_customer_id) then
    raise exception 'PC: That customer does not exist.';
  end if;
  insert into public.notifications (customer_id, title, body, type)
  values (p_customer_id, 'Message from Pindi Crust', p_body, 'news');
end;
$$;
grant execute on function public.send_customer_message(uuid, text) to authenticated;

-- ============ Notify customer when their order status changes ============
create or replace function public.notify_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and new.customer_id is not null then
    insert into public.notifications (customer_id, title, body, type)
    values (
      new.customer_id,
      'Order ' || new.order_number || ' updated',
      'Your order is now ' || replace(new.status, '_', ' ') || '.',
      'order'
    );
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger on_order_status_change before update on public.orders for each row execute function public.notify_order_status_change();
