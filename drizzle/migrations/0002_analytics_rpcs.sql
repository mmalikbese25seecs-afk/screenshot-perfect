
-- All analytics/report functions are staff-only.

create or replace function public.analytics_revenue_trend(p_days integer)
returns table(day date, revenue numeric, orders bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return query
    select d.day::date,
           coalesce(sum(o.total), 0) as revenue,
           count(o.id) as orders
    from generate_series((current_date - (p_days - 1)), current_date, interval '1 day') as d(day)
    left join public.orders o
      on o.placed_at::date = d.day::date and o.status <> 'cancelled'
    group by d.day
    order by d.day;
end;
$$;

create or replace function public.analytics_category_sales(p_days integer)
returns table(name text, value numeric)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return query
    select coalesce(c.name, 'Uncategorised') as name,
           coalesce(sum(i.price * i.qty), 0) as value
    from public.order_items i
    join public.orders o on o.id = i.order_id
    left join public.products p on p.id = i.product_id
    left join public.categories c on c.id = p.category_id
    where o.placed_at >= now() - make_interval(days => p_days)
      and o.status <> 'cancelled'
    group by c.name
    order by value desc;
end;
$$;

create or replace function public.analytics_peak_hours(p_days integer)
returns table(hour text, orders bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return query
    select to_char(h.h, 'HH24:00') as hour,
           count(o.id) as orders
    from generate_series(0, 23) as h(h)
    left join public.orders o
      on extract(hour from o.placed_at) = h.h
     and o.placed_at >= now() - make_interval(days => p_days)
     and o.status <> 'cancelled'
    group by h.h
    order by h.h;
end;
$$;

create or replace function public.analytics_customer_growth()
returns table(month text, "newCustomers" bigint, "returning" bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return query
    with months as (
      select date_trunc('month', current_date - (n || ' months')::interval) as m
      from generate_series(5, 0, -1) n
    ),
    first_orders as (
      select customer_id, min(date_trunc('month', placed_at)) as first_month
      from public.orders
      where customer_id is not null and status <> 'cancelled'
      group by customer_id
    ),
    month_orders as (
      select distinct customer_id, date_trunc('month', placed_at) as m
      from public.orders
      where customer_id is not null and status <> 'cancelled'
    )
    select to_char(months.m, 'Mon') as month,
           coalesce((select count(*) from first_orders f where f.first_month = months.m), 0) as "newCustomers",
           coalesce((select count(*) from month_orders mo join first_orders f on f.customer_id = mo.customer_id
             where mo.m = months.m and f.first_month < months.m), 0) as "returning"
    from months
    order by months.m;
end;
$$;

create or replace function public.analytics_payment_split(p_days integer)
returns table(name text, value bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return query
    select case o.payment
             when 'cod' then 'Cash on Delivery'
             when 'easypaisa' then 'EasyPaisa'
             when 'jazzcash' then 'JazzCash'
             else o.payment end as name,
           count(*) as value
    from public.orders o
    where o.placed_at >= now() - make_interval(days => p_days)
      and o.status <> 'cancelled'
    group by o.payment
    order by value desc;
end;
$$;

create or replace function public.analytics_top_products(p_days integer, p_limit integer, p_direction text)
returns table(name text, sold bigint)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  if p_direction = 'slow' then
    return query
      select i.name, sum(i.qty) as sold
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where o.placed_at >= now() - make_interval(days => p_days)
        and o.status <> 'cancelled'
      group by i.name
      order by sold asc nulls last
      limit p_limit;
  else
    return query
      select i.name, sum(i.qty) as sold
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where o.placed_at >= now() - make_interval(days => p_days)
        and o.status <> 'cancelled'
      group by i.name
      order by sold desc nulls last
      limit p_limit;
  end if;
end;
$$;

-- ============ Reports (rows for the generated report files) ============
create or replace function public.report_orders(p_days integer)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'order_number', o.order_number, 'customer', o.customer_name, 'phone', o.phone,
      'status', o.status, 'source', o.source, 'payment', o.payment,
      'subtotal', o.subtotal, 'discount', o.discount, 'delivery_fee', o.delivery_fee,
      'tax', o.tax, 'total', o.total, 'placed_at', o.placed_at
    ) order by o.placed_at desc)
    from public.orders o
    where o.placed_at >= now() - make_interval(days => p_days)
  ), '[]'::jsonb);
end;
$$;

create or replace function public.report_items(p_days integer)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'name', i.name, 'qty', i.qty, 'price', i.price, 'line_total', i.price * i.qty,
      'order_number', o.order_number, 'placed_at', o.placed_at
    ) order by o.placed_at desc)
    from public.order_items i
    join public.orders o on o.id = i.order_id
    where o.placed_at >= now() - make_interval(days => p_days)
      and o.status <> 'cancelled'
  ), '[]'::jsonb);
end;
$$;

create or replace function public.report_payments(p_days integer)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'payment', o.payment, 'payment_status', o.payment_status,
      'orders', o.cnt, 'total', o.sum_total
    ))
    from (
      select payment, payment_status, count(*) as cnt, sum(total) as sum_total
      from public.orders
      where placed_at >= now() - make_interval(days => p_days) and status <> 'cancelled'
      group by payment, payment_status
    ) o
  ), '[]'::jsonb);
end;
$$;

create or replace function public.report_taxes(p_days integer)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_staff(auth.uid()) then raise exception 'PC: Staff only.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'day', d.day, 'orders', d.cnt, 'taxable', d.subtotal_less_discount, 'tax', d.tax_total
    ) order by d.day)
    from (
      select placed_at::date as day, count(*) as cnt,
             sum(greatest(subtotal - discount, 0)) as subtotal_less_discount,
             sum(tax) as tax_total
      from public.orders
      where placed_at >= now() - make_interval(days => p_days) and status <> 'cancelled'
      group by placed_at::date
    ) d
  ), '[]'::jsonb);
end;
$$;

grant execute on function public.analytics_revenue_trend(integer) to authenticated;
grant execute on function public.analytics_category_sales(integer) to authenticated;
grant execute on function public.analytics_peak_hours(integer) to authenticated;
grant execute on function public.analytics_customer_growth() to authenticated;
grant execute on function public.analytics_payment_split(integer) to authenticated;
grant execute on function public.analytics_top_products(integer, integer, text) to authenticated;
grant execute on function public.report_orders(integer) to authenticated;
grant execute on function public.report_items(integer) to authenticated;
grant execute on function public.report_payments(integer) to authenticated;
grant execute on function public.report_taxes(integer) to authenticated;
