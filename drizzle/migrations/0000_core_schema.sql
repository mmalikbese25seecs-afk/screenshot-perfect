
-- ============ Roles ============
create type public.app_role as enum ('customer', 'manager', 'admin', 'developer');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('manager','admin','developer'))
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','developer'))
$$;

-- ============ Profiles ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer','manager','admin','developer')),
  is_blocked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());
create policy "staff read all profiles" on public.profiles for select to authenticated using (public.is_staff(auth.uid()));
create policy "users update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "staff update profiles" on public.profiles for update to authenticated using (public.is_staff(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, role)
  values (new.id, new.email, new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'phone', 'customer');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Role / blocking changes: only admin or developer. Bootstrap: allowed when no admin/developer exists yet.
create or replace function public.guard_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role) or (new.is_blocked is distinct from old.is_blocked) then
    if not public.is_admin(auth.uid()) and exists (select 1 from public.user_roles where role in ('admin','developer')) then
      raise exception 'PC: Only an admin can change roles or block customers.';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles for each row execute function public.guard_profile_role_change();

create or replace function public.sync_user_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role then
    delete from public.user_roles where user_id = new.id;
    if new.role in ('manager','admin','developer') then
      insert into public.user_roles (user_id, role) values (new.id, new.role::public.app_role);
    end if;
  end if;
  return new;
end;
$$;
create trigger profiles_sync_roles after update on public.profiles for each row execute function public.sync_user_roles();

-- ============ Catalogue ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text not null default 'Pizza',
  image_url text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  old_price numeric(10,2),
  image_url text,
  gallery text[] not null default '{}',
  short_description text not null default '',
  description text not null default '',
  ingredients text[] not null default '{}',
  nutrition jsonb not null default '[]',
  badges text[] not null default '{}',
  popular boolean not null default false,
  recommended boolean not null default false,
  rating numeric(3,2) not null default 0,
  review_count integer not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);
create table public.add_ons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  group_name text not null default 'General',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.categories to anon;
grant select on public.products to anon;
grant select on public.add_ons to anon;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.add_ons to authenticated;
grant all on public.categories to service_role;
grant all on public.products to service_role;
grant all on public.add_ons to service_role;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.add_ons enable row level security;

create policy "public read visible categories" on public.categories for select to anon using (is_visible);
create policy "staff read all categories" on public.categories for select to authenticated using (public.is_staff(auth.uid()));
create policy "customers read visible categories" on public.categories for select to authenticated using (is_visible);
create policy "staff write categories" on public.categories for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update categories" on public.categories for update to authenticated using (public.is_staff(auth.uid()));
create policy "admins delete categories" on public.categories for delete to authenticated using (public.is_admin(auth.uid()));

create policy "public read available products" on public.products for select to anon using (is_available);
create policy "customers read available products" on public.products for select to authenticated using (is_available);
create policy "staff read all products" on public.products for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write products" on public.products for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update products" on public.products for update to authenticated using (public.is_staff(auth.uid()));
create policy "admins delete products" on public.products for delete to authenticated using (public.is_admin(auth.uid()));

create policy "public read active add_ons" on public.add_ons for select to anon using (is_active);
create policy "customers read active add_ons" on public.add_ons for select to authenticated using (is_active);
create policy "staff read all add_ons" on public.add_ons for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write add_ons" on public.add_ons for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update add_ons" on public.add_ons for update to authenticated using (public.is_staff(auth.uid()));
create policy "admins delete add_ons" on public.add_ons for delete to authenticated using (public.is_admin(auth.uid()));

-- ============ Offers / advertisements ============
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text not null default '',
  tag text not null default '',
  cta text not null default '',
  image_url text,
  is_active boolean not null default true,
  link_type text not null default 'product' check (link_type in ('product','external')),
  link_target text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.offers to anon;
grant select, insert, update, delete on public.offers to authenticated;
grant all on public.offers to service_role;
alter table public.offers enable row level security;
create policy "public read active offers" on public.offers for select to anon using (is_active);
create policy "customers read active offers" on public.offers for select to authenticated using (is_active);
create policy "staff read all offers" on public.offers for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write offers" on public.offers for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update offers" on public.offers for update to authenticated using (public.is_staff(auth.uid()));
create policy "staff delete offers" on public.offers for delete to authenticated using (public.is_staff(auth.uid()));

-- Only publishable destinations: a product slug that exists, or an https link.
create or replace function public.guard_offer_destination()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_active then
    if new.link_type = 'product' then
      if not exists (select 1 from public.products where slug = new.link_target) then
        raise exception 'PC: This advertisement points to a menu item that does not exist.';
      end if;
    elsif new.link_type = 'external' then
      if new.link_target !~* '^https://' then
        raise exception 'PC: External advertisement links must start with https://';
      end if;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
create trigger offers_guard before insert or update on public.offers for each row execute function public.guard_offer_destination();

-- ============ Promo codes ============
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent','flat')),
  discount_value numeric(10,2) not null check (discount_value > 0),
  active boolean not null default true,
  usage_count integer not null default 0,
  usage_limit integer,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.promo_codes to authenticated;
grant all on public.promo_codes to service_role;
alter table public.promo_codes enable row level security;
create policy "staff manage promo_codes" on public.promo_codes for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ Orders ============
create sequence public.order_number_seq start 1;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid,
  customer_name text not null,
  phone text,
  address text,
  notes text,
  transaction_id text,
  promo_code text,
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0,
  delivery_fee numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','preparing','baking','out_for_delivery','delivered','cancelled')),
  source text not null default 'online' check (source in ('online','pos')),
  payment text not null default 'cod' check (payment in ('cod','easypaisa','jazzcash')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  idempotency_key text unique,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_customer_idx on public.orders(customer_id);
create index orders_status_idx on public.orders(status);
create index orders_placed_at_idx on public.orders(placed_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  name text not null,
  qty integer not null check (qty > 0),
  price numeric(10,2) not null,
  product_id uuid,
  addons jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items(order_id);

grant select, update on public.orders to authenticated;
grant select on public.order_items to authenticated;
grant all on public.orders to service_role;
grant all on public.order_items to service_role;
grant usage on sequence public.order_number_seq to authenticated;
grant usage on sequence public.order_number_seq to service_role;

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "customers read own orders" on public.orders for select to authenticated using (customer_id = auth.uid());
create policy "staff read all orders" on public.orders for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff update orders" on public.orders for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create policy "customers read own order items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.customer_id = auth.uid()));
create policy "staff read all order items" on public.order_items for select to authenticated using (public.is_staff(auth.uid()));

-- ============ Reviews ============
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  product_name text not null default 'General',
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  featured boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant insert on public.reviews to anon;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "public read approved reviews" on public.reviews for select to anon using (status = 'approved');
create policy "customers read approved reviews" on public.reviews for select to authenticated using (status = 'approved');
create policy "staff read all reviews" on public.reviews for select to authenticated using (public.is_staff(auth.uid()));
create policy "anyone submits pending review" on public.reviews for insert to anon with check (status = 'pending');
create policy "signed-in submits pending review" on public.reviews for insert to authenticated with check (status = 'pending');
create policy "staff update reviews" on public.reviews for update to authenticated using (public.is_staff(auth.uid()));
create policy "admins delete reviews" on public.reviews for delete to authenticated using (public.is_admin(auth.uid()));

-- ============ Saved addresses ============
create table public.saved_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  label text not null,
  line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_addresses to authenticated;
grant all on public.saved_addresses to service_role;
alter table public.saved_addresses enable row level security;
create policy "owners manage addresses" on public.saved_addresses for all to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- ============ Notifications ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null,
  title text not null,
  body text not null default '',
  unread boolean not null default true,
  type text not null default 'news' check (type in ('order','promo','review','news')),
  created_at timestamptz not null default now()
);
create index notifications_customer_idx on public.notifications(customer_id);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "owners read notifications" on public.notifications for select to authenticated using (customer_id = auth.uid());
create policy "owners mark notifications read" on public.notifications for update to authenticated using (customer_id = auth.uid()) with check (customer_id = auth.uid());

-- ============ Activity logs & reports ============
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor_name text not null default '',
  action text not null,
  target text not null default '',
  module text not null default 'general',
  level text not null default 'info' check (level in ('info','warning','critical')),
  created_at timestamptz not null default now()
);
grant select on public.activity_logs to authenticated;
grant all on public.activity_logs to service_role;
alter table public.activity_logs enable row level security;
create policy "staff read activity logs" on public.activity_logs for select to authenticated using (public.is_staff(auth.uid()));

create table public.reports (
  id text primary key,
  type text not null,
  format text not null,
  range text not null,
  status text not null default 'processing' check (status in ('processing','ready','failed')),
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "staff manage reports" on public.reports for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ Contact & newsletter ============
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  created_at timestamptz not null default now()
);
grant insert on public.contact_messages to anon;
grant select, insert on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;
create policy "anyone sends contact message" on public.contact_messages for insert to anon with check (true);
create policy "signed-in sends contact message" on public.contact_messages for insert to authenticated with check (true);
create policy "staff read contact messages" on public.contact_messages for select to authenticated using (public.is_staff(auth.uid()));

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);
grant insert on public.newsletter_subscribers to anon;
grant select, insert, delete on public.newsletter_subscribers to authenticated;
grant all on public.newsletter_subscribers to service_role;
alter table public.newsletter_subscribers enable row level security;
create policy "anyone subscribes" on public.newsletter_subscribers for insert to anon with check (true);
create policy "signed-in subscribes" on public.newsletter_subscribers for insert to authenticated with check (true);
create policy "staff read subscribers" on public.newsletter_subscribers for select to authenticated using (public.is_staff(auth.uid()));

-- ============ Settings (single-row, camelCase columns match the frontend) ============
create table public.store_settings (
  id integer primary key default 1 check (id = 1),
  "storeName" text not null default '',
  phone text not null default '',
  whatsapp text not null default '',
  email text not null default '',
  address text not null default '',
  hours text not null default '',
  "deliveryFee" numeric(10,2),
  "taxRate" numeric(5,2),
  "minOrder" numeric(10,2),
  "deliveryRadiusKm" numeric(6,2),
  "acceptingOrders" boolean not null default true,
  updated_at timestamptz not null default now()
);
create table public.payment_settings (
  id integer primary key default 1 check (id = 1),
  "codEnabled" boolean not null default true,
  "easypaisaEnabled" boolean not null default false,
  "easypaisaNumber" text not null default '',
  "jazzcashEnabled" boolean not null default false,
  "jazzcashNumber" text not null default '',
  "cardEnabled" boolean not null default false,
  updated_at timestamptz not null default now()
);
create table public.maintenance_settings (
  id integer primary key default 1 check (id = 1),
  enabled boolean not null default false,
  message text not null default '',
  eta text not null default '',
  updated_at timestamptz not null default now()
);
create table public.brand_settings (
  id integer primary key default 1 check (id = 1),
  settings jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

grant select on public.store_settings to anon;
grant select on public.payment_settings to anon;
grant select on public.maintenance_settings to anon;
grant select on public.brand_settings to anon;
grant select, insert, update on public.store_settings to authenticated;
grant select, insert, update on public.payment_settings to authenticated;
grant select, insert, update on public.maintenance_settings to authenticated;
grant select, insert, update on public.brand_settings to authenticated;
grant all on public.store_settings to service_role;
grant all on public.payment_settings to service_role;
grant all on public.maintenance_settings to service_role;
grant all on public.brand_settings to service_role;

alter table public.store_settings enable row level security;
alter table public.payment_settings enable row level security;
alter table public.maintenance_settings enable row level security;
alter table public.brand_settings enable row level security;

create policy "public read store settings" on public.store_settings for select to anon using (true);
create policy "signed-in read store settings" on public.store_settings for select to authenticated using (true);
create policy "admins write store settings" on public.store_settings for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admins update store settings" on public.store_settings for update to authenticated using (public.is_admin(auth.uid()));

create policy "public read payment settings" on public.payment_settings for select to anon using (true);
create policy "signed-in read payment settings" on public.payment_settings for select to authenticated using (true);
create policy "admins write payment settings" on public.payment_settings for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admins update payment settings" on public.payment_settings for update to authenticated using (public.is_admin(auth.uid()));

create policy "public read maintenance settings" on public.maintenance_settings for select to anon using (true);
create policy "signed-in read maintenance settings" on public.maintenance_settings for select to authenticated using (true);
create policy "admins write maintenance settings" on public.maintenance_settings for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admins update maintenance settings" on public.maintenance_settings for update to authenticated using (public.is_admin(auth.uid()));

create policy "public read brand settings" on public.brand_settings for select to anon using (true);
create policy "signed-in read brand settings" on public.brand_settings for select to authenticated using (true);
create policy "admins write brand settings" on public.brand_settings for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admins update brand settings" on public.brand_settings for update to authenticated using (public.is_admin(auth.uid()));

-- ============ Customer notes ============
create table public.customer_notes (
  customer_id uuid primary key,
  note text not null default '',
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.customer_notes to authenticated;
grant all on public.customer_notes to service_role;
alter table public.customer_notes enable row level security;
create policy "staff manage customer notes" on public.customer_notes for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

-- ============ Inventory (camelCase columns match the frontend) ============
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "group" text not null default 'General',
  unit text not null default 'pcs' check (unit in ('kg','g','l','ml','pcs','pack')),
  quantity numeric(12,3) not null default 0,
  "lowStockThreshold" numeric(12,3) not null default 0,
  "updatedAt" timestamptz not null default now(),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.inventory_items to authenticated;
grant all on public.inventory_items to service_role;
alter table public.inventory_items enable row level security;
create policy "staff read inventory" on public.inventory_items for select to authenticated using (public.is_staff(auth.uid()));
create policy "staff write inventory" on public.inventory_items for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "staff update inventory" on public.inventory_items for update to authenticated using (public.is_staff(auth.uid()));
create policy "admins delete inventory" on public.inventory_items for delete to authenticated using (public.is_admin(auth.uid()));

-- ============ Branches ============
create table public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null default '',
  phone text not null default '',
  hours text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.branches to anon;
grant select, insert, update, delete on public.branches to authenticated;
grant all on public.branches to service_role;
alter table public.branches enable row level security;
create policy "public read active branches" on public.branches for select to anon using (is_active);
create policy "customers read active branches" on public.branches for select to authenticated using (is_active);
create policy "staff read all branches" on public.branches for select to authenticated using (public.is_staff(auth.uid()));
create policy "admins write branches" on public.branches for insert to authenticated with check (public.is_admin(auth.uid()));
create policy "admins update branches" on public.branches for update to authenticated using (public.is_admin(auth.uid()));
create policy "admins delete branches" on public.branches for delete to authenticated using (public.is_admin(auth.uid()));
