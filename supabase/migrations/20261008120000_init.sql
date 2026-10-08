-- Kalori Lens: başlangıç şeması
-- Tüm kullanıcı tablolarında RLS açık; her kullanıcı yalnızca kendi satırlarını görür.
-- Tarihler istemcinin YEREL günü olarak saklanır (date), saat dilimi kaymasını önlemek için.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Ortak yardımcılar
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profil
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  gender text not null check (gender in ('male', 'female')),
  weight_kg numeric(5, 1) not null check (weight_kg between 30 and 300),
  height_cm numeric(5, 1) not null check (height_cm between 100 and 250),
  age smallint not null check (age between 13 and 100),
  activity text not null check (activity in ('sedentary', 'light', 'moderate', 'active', 'veryActive')),
  goal text not null check (goal in ('lose', 'maintain', 'gain')),
  target_weight_kg numeric(5, 1) check (target_weight_kg between 30 and 300),
  locale text not null default 'tr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Yiyecek kataloğu (herkese açık okuma, yazma yalnızca servis rolüyle)
-- Besin değerleri 100 g başına; porsiyonlar gram karşılıklarıyla.
-- ---------------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name_tr text not null,
  name_en text,
  barcode text unique,
  kcal_100g numeric(6, 1) not null check (kcal_100g >= 0),
  protein_100g numeric(5, 1) not null default 0 check (protein_100g >= 0),
  carbs_100g numeric(5, 1) not null default 0 check (carbs_100g >= 0),
  fat_100g numeric(5, 1) not null default 0 check (fat_100g >= 0),
  -- örn. [{"unit":"slice","grams":25},{"unit":"piece","grams":50}]
  portions jsonb not null default '[]'::jsonb,
  source text not null default 'curated' check (source in ('curated', 'openfoodfacts', 'ai')),
  created_at timestamptz not null default now()
);

create index foods_name_tr_idx on public.foods using gin (to_tsvector('simple', name_tr));

-- ---------------------------------------------------------------------------
-- Günlük kayıtlar
-- id istemcide üretilir (çevrimdışı oluşturma ve senkronizasyon için).
-- deleted_at: silmeler de senkronize edilsin diye yumuşak silme.
-- ---------------------------------------------------------------------------
create table public.food_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id uuid references public.foods (id) on delete set null,
  name text not null,
  grams numeric(7, 1) not null check (grams > 0),
  portion_label text,
  kcal numeric(7, 1) not null check (kcal >= 0),
  protein numeric(6, 1) not null default 0,
  carbs numeric(6, 1) not null default 0,
  fat numeric(6, 1) not null default 0,
  source text not null default 'manual' check (source in ('manual', 'catalog', 'barcode', 'photo', 'recipe')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index food_entries_user_day_idx on public.food_entries (user_id, day);
create index food_entries_user_updated_idx on public.food_entries (user_id, updated_at);

create table public.exercise_entries (
  id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  exercise_type text not null,
  duration_min smallint not null check (duration_min between 1 and 1440),
  kcal numeric(7, 1) not null check (kcal >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index exercise_entries_user_day_idx on public.exercise_entries (user_id, day);

create table public.water_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  ml integer not null default 0 check (ml between 0 and 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.weight_logs (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 30 and 300),
  updated_at timestamptz not null default now(),
  primary key (user_id, day)
);

create table public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

-- ---------------------------------------------------------------------------
-- Premium hakları (RevenueCat webhook'u servis rolüyle yazar; kullanıcı sadece okur)
-- ---------------------------------------------------------------------------
create table public.entitlements (
  user_id uuid primary key references auth.users (id) on delete cascade,
  is_premium boolean not null default false,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- AI kullanım kotası (istemci doğrudan erişemez; yalnızca consume_ai_quota ile)
-- ---------------------------------------------------------------------------
create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  feature text not null,
  count integer not null default 0,
  primary key (user_id, day, feature)
);

-- updated_at tetikleyicileri
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger food_entries_updated_at before update on public.food_entries
  for each row execute function public.set_updated_at();
create trigger exercise_entries_updated_at before update on public.exercise_entries
  for each row execute function public.set_updated_at();
create trigger water_entries_updated_at before update on public.water_entries
  for each row execute function public.set_updated_at();
create trigger weight_logs_updated_at before update on public.weight_logs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.foods enable row level security;
alter table public.food_entries enable row level security;
alter table public.exercise_entries enable row level security;
alter table public.water_entries enable row level security;
alter table public.weight_logs enable row level security;
alter table public.favorites enable row level security;
alter table public.entitlements enable row level security;
alter table public.ai_usage enable row level security;

create policy "foods: herkes okur" on public.foods
  for select to anon, authenticated using (true);

create policy "profiles: kendi satırı" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "food_entries: kendi satırları" on public.food_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "exercise_entries: kendi satırları" on public.exercise_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "water_entries: kendi satırları" on public.water_entries
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "weight_logs: kendi satırları" on public.weight_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "favorites: kendi satırları" on public.favorites
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "entitlements: kendi satırını okur" on public.entitlements
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- ai_usage için politika yok: istemciden okuma/yazma kapalı.

-- ---------------------------------------------------------------------------
-- Kota: atomik olarak sayacı artırır ve izin verilip verilmediğini döner.
-- Limitler burada tanımlı; istemci limit gönderemez.
-- ---------------------------------------------------------------------------
create or replace function public.ai_daily_limit(p_feature text)
returns integer
language sql
immutable
as $$
  select case p_feature
    when 'analyze_photo' then 3
    when 'estimate_product' then 10
    when 'chef_recipe' then 2
    else 0
  end;
$$;

create or replace function public.is_premium(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select e.is_premium and (e.expires_at is null or e.expires_at > now())
       from public.entitlements e
      where e.user_id = p_user),
    false
  );
$$;

create or replace function public.consume_ai_quota(p_feature text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer := public.ai_daily_limit(p_feature);
  v_premium boolean;
  v_count integer;
  v_day date := (now() at time zone 'utc')::date;
begin
  if v_user is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if v_limit = 0 then
    raise exception 'unknown feature: %', p_feature using errcode = '22023';
  end if;

  v_premium := public.is_premium(v_user);

  insert into public.ai_usage as u (user_id, day, feature, count)
  values (v_user, v_day, p_feature, 1)
  on conflict (user_id, day, feature)
  do update set count = u.count + 1
  where v_premium or u.count < v_limit
  returning u.count into v_count;

  if v_count is null then
    -- Limit doldu; sayaç artırılmadı.
    return jsonb_build_object('allowed', false, 'premium', false, 'limit', v_limit, 'remaining', 0);
  end if;

  return jsonb_build_object(
    'allowed', true,
    'premium', v_premium,
    'limit', case when v_premium then null else v_limit end,
    'remaining', case when v_premium then null else greatest(v_limit - v_count, 0) end
  );
end;
$$;

-- Başarısız AI çağrısında kotayı geri vermek için (yalnızca servis rolü).
create or replace function public.refund_ai_quota(p_user uuid, p_feature text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.ai_usage
     set count = greatest(count - 1, 0)
   where user_id = p_user
     and day = (now() at time zone 'utc')::date
     and feature = p_feature;
$$;

revoke all on function public.consume_ai_quota(text) from public, anon;
grant execute on function public.consume_ai_quota(text) to authenticated;
revoke all on function public.refund_ai_quota(uuid, text) from public, anon, authenticated;
-- Başka kullanıcıların premium durumu sorgulanamasın; yalnızca security definer fonksiyonlar kullanır.
revoke all on function public.is_premium(uuid) from public, anon, authenticated;
