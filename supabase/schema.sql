-- =====================================================================
-- ヘアスタイル投票アプリ：テーブル定義
-- Supabase の「SQL Editor」に、このファイルの中身をまるごと貼り付けて実行してください。
-- 何度実行しても壊れないように書いてあります。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. スタイル写真マスタ
-- ---------------------------------------------------------------------
create table if not exists styles (
  id            uuid primary key default gen_random_uuid(),
  image_url     text not null,
  thumb_url     text,
  title         text not null,           -- スタイル名
  stylist       text,                    -- 担当スタイリスト
  caption       text,                    -- 説明文
  tags          text[],                  -- ハッシュタグ
  salon         text,                    -- 'PAUL' | 'COCO' | 'GYOTOKU' | 'ALI_LEVEL' | null(共通)
  display_order int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. 投票セッション（お客様1人＝1行）
-- ---------------------------------------------------------------------
create table if not exists ballots (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null,            -- ブラウザに保存しているUUID
  seat         text,                     -- 席番号（任意）
  salon        text,
  status       text not null default 'draft',  -- 'draft' | 'submitted'
  submitted_at timestamptz,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. 個別のいいね
-- ---------------------------------------------------------------------
create table if not exists votes (
  id         uuid primary key default gen_random_uuid(),
  ballot_id  uuid not null references ballots(id) on delete cascade,
  style_id   uuid not null references styles(id),
  rank       int,                        -- 選択順（1〜5）
  created_at timestamptz not null default now(),
  unique (ballot_id, style_id)           -- ★同じ投票で同じ写真の二重登録をDBで防ぐ
);

create index if not exists votes_style_id_idx   on votes (style_id);
create index if not exists ballots_submitted_idx on ballots (submitted_at);
create index if not exists styles_active_order_idx on styles (is_active, display_order);

-- ★同じ投票セッションから2回投票が届いても、1件しか確定しないようにする
--   （通信の再送や、確定ボタンの二度押し対策）
create unique index if not exists ballots_one_submitted_per_session
  on ballots (session_id) where status = 'submitted';

-- ---------------------------------------------------------------------
-- 4. アクセス制限（RLS = Row Level Security）
--    「誰がどの行を読み書きしてよいか」の設定。
--    ここでは全テーブルで有効にし、許可ルールを1つも作らない。
--    → ブラウザから直接データベースを触ることは一切できず、
--      アプリのサーバー側（秘密キーを持つ側）からのみ読み書きできる。
-- ---------------------------------------------------------------------
alter table styles  enable row level security;
alter table ballots enable row level security;
alter table votes   enable row level security;

-- ---------------------------------------------------------------------
-- 5. 投票を確定する関数
--    アプリはこの関数を1回呼ぶだけ。関数の中身は「1つのトランザクション」
--    としてまとめて実行されるので、途中で失敗しても中途半端に保存されない。
--    枚数の上限などの検証もここ（サーバー側）で行い、画面側の制御だけを信用しない。
-- ---------------------------------------------------------------------
create or replace function submit_ballot(
  p_session_id text,
  p_seat       text,
  p_salon      text,
  p_style_ids  uuid[]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ballot_id uuid;
  v_count     int;
begin
  v_count := coalesce(array_length(p_style_ids, 1), 0);

  if v_count < 1 then
    raise exception 'no_styles' using errcode = 'check_violation';
  end if;

  -- ★1投票あたり最大5票（画面側の制御とは別に、サーバー側でも必ず検証する）
  if v_count > 5 then
    raise exception 'too_many_styles' using errcode = 'check_violation';
  end if;

  -- 同じ写真が2回入っていないか
  if v_count <> (select count(distinct s) from unnest(p_style_ids) as s) then
    raise exception 'duplicate_styles' using errcode = 'check_violation';
  end if;

  -- すでに投票済みのセッションなら、二重に作らず既存の投票を返す
  select id into v_ballot_id
  from ballots
  where session_id = p_session_id and status = 'submitted'
  limit 1;

  if v_ballot_id is not null then
    return v_ballot_id;
  end if;

  insert into ballots (session_id, seat, salon, status, submitted_at)
  values (p_session_id, p_seat, p_salon, 'submitted', now())
  returning id into v_ballot_id;

  -- 選択順（1〜5）を rank として一緒に保存する
  insert into votes (ballot_id, style_id, rank)
  select v_ballot_id, s.style_id, s.ord
  from unnest(p_style_ids) with ordinality as s(style_id, ord)
  join styles st on st.id = s.style_id and st.is_active;

  -- 存在しない写真や非表示の写真が混ざっていたら、投票ごと取り消す
  if (select count(*) from votes where ballot_id = v_ballot_id) <> v_count then
    raise exception 'invalid_style' using errcode = 'check_violation';
  end if;

  return v_ballot_id;

exception
  -- ほぼ同時に2回届いた場合も、先に入ったほうの投票を返す
  when unique_violation then
    select id into v_ballot_id
    from ballots
    where session_id = p_session_id and status = 'submitted'
    limit 1;
    return v_ballot_id;
end;
$$;

-- =====================================================================
-- ここから下は管理画面（フェーズ4）で使うものです。
-- schema.sql をもう一度まるごと実行すれば、この部分も反映されます。
-- =====================================================================

-- ---------------------------------------------------------------------
-- 6. 写真の保存場所（Supabase Storage のバケット）
--    public = true にして、投票画面から写真を表示できるようにする。
--    アップロードはアプリのサーバー側（秘密キーを持つ側）からのみ行う。
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('style-photos', 'style-photos', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 7. ランキング集計
--    カウンターを持たず、そのつど COUNT で数える（同時更新でズレないため）。
--    p_from / p_to / p_salon が null のときは、その条件で絞り込まない。
-- ---------------------------------------------------------------------
create or replace function admin_ranking(
  p_from  timestamptz,
  p_to    timestamptz,
  p_salon text
) returns table (
  style_id  uuid,
  title     text,
  stylist   text,
  thumb_url text,
  image_url text,
  salon     text,
  is_active boolean,
  votes     bigint
)
language sql
security definer
set search_path = public
as $$
  select s.id, s.title, s.stylist, s.thumb_url, s.image_url, s.salon, s.is_active,
         count(b.id) as votes
  from styles s
  left join votes v on v.style_id = s.id
  left join ballots b
         on b.id = v.ballot_id
        and b.status = 'submitted'
        and (p_from  is null or b.submitted_at >= p_from)
        and (p_to    is null or b.submitted_at <  p_to)
        and (p_salon is null or b.salon = p_salon)
  group by s.id
  order by count(b.id) desc, s.display_order;
$$;

-- ---------------------------------------------------------------------
-- 8. サマリー（総投票数・総いいね数・平均選択枚数）
--    総投票数 = 投票したお客様の人数
-- ---------------------------------------------------------------------
create or replace function admin_summary(
  p_from  timestamptz,
  p_to    timestamptz,
  p_salon text
) returns table (
  total_ballots bigint,
  total_votes   bigint,
  avg_votes     numeric
)
language sql
security definer
set search_path = public
as $$
  with target as (
    select id from ballots
    where status = 'submitted'
      and (p_from  is null or submitted_at >= p_from)
      and (p_to    is null or submitted_at <  p_to)
      and (p_salon is null or salon = p_salon)
  ),
  counted as (
    select (select count(*) from target) as ballots,
           (select count(*) from votes v where v.ballot_id in (select id from target)) as votes
  )
  select ballots,
         votes,
         case when ballots = 0 then 0 else round(votes::numeric / ballots, 2) end
  from counted;
$$;

-- ---------------------------------------------------------------------
-- 9. 表示順の入れ替え（2件の display_order を交換する）
--    1つの処理としてまとめて実行されるので、途中で崩れない。
-- ---------------------------------------------------------------------
create or replace function admin_swap_display_order(p_a uuid, p_b uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_a int;
  v_b int;
begin
  select display_order into v_a from styles where id = p_a for update;
  select display_order into v_b from styles where id = p_b for update;
  if v_a is null or v_b is null then
    raise exception 'style_not_found';
  end if;
  update styles set display_order = v_b where id = p_a;
  update styles set display_order = v_a where id = p_b;
end;
$$;

-- ---------------------------------------------------------------------
-- 10. アプリの設定を1件ずつ保存しておく場所
--     いまは「集計のリセット日時」を入れるために使う。
--
--     リセットしても投票データそのものは消さず、
--     「この日時より後だけを数える」という開始点を記録するだけにしている。
--     こうすることで、間違えて押しても元に戻せる。
-- ---------------------------------------------------------------------
create table if not exists app_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

-- =====================================================================
-- 11. スタイリスト名簿と、コンテストの集計
-- =====================================================================

-- ---------------------------------------------------------------------
-- スタイリスト名簿。
-- 写真を登録するときは、ここから選ぶ（手入力だと表記ゆれで別人扱いになるため）。
--
-- ★店舗賞の「所属スタッフ数」は、この名簿に登録されている人数を使う。
--   出品していないスタッフも登録しておけば、その人数で割られる。
-- ---------------------------------------------------------------------
create table if not exists stylists (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  salon         text,                    -- 所属店舗
  display_order int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create unique index if not exists stylists_name_idx on stylists (name);
alter table stylists enable row level security;

-- 写真がどのスタイリストのものかを結びつける
alter table styles add column if not exists stylist_id uuid references stylists(id);
create index if not exists styles_stylist_idx on styles (stylist_id);

-- すでに手入力で登録済みの担当者名から、名簿を作って結びつける（初回だけ効く）。
-- 同じ名前が複数の店舗のスタイルに付いていることがあるので、名前ごとに1人にまとめる。
-- 所属店舗はあとから管理画面で直せる。
insert into stylists (name, salon)
select distinct on (s.stylist) s.stylist, s.salon
from styles s
where s.stylist is not null
  and s.stylist <> ''
  and not exists (select 1 from stylists t where t.name = s.stylist)
order by s.stylist, s.display_order;

update styles s
set stylist_id = t.id
from stylists t
where s.stylist_id is null and s.stylist = t.name;

-- ---------------------------------------------------------------------
-- 表彰2：スタイリスト別（合計いいね数の多い順）
-- ---------------------------------------------------------------------
create or replace function admin_stylist_ranking(
  p_from  timestamptz,
  p_to    timestamptz,
  p_salon text
) returns table (
  stylist_id  uuid,
  name        text,
  salon       text,
  style_count bigint,
  votes       bigint
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.name, t.salon,
         count(distinct s.id) as style_count,
         count(b.id)          as votes
  from stylists t
  left join styles s on s.stylist_id = t.id
  left join votes  v on v.style_id = s.id
  left join ballots b
         on b.id = v.ballot_id
        and b.status = 'submitted'
        and (p_from is null or b.submitted_at >= p_from)
        and (p_to   is null or b.submitted_at <  p_to)
  where t.is_active
    and (p_salon is null or t.salon = p_salon)
  group by t.id
  order by count(b.id) desc, t.name;
$$;

-- ---------------------------------------------------------------------
-- 表彰3：店舗賞（合計いいね数 ÷ 所属スタッフ数 ＝ 1人あたりいいね数）
--        分母は stylists に登録されている在籍スタッフの人数。
-- ---------------------------------------------------------------------
create or replace function admin_salon_ranking(
  p_from timestamptz,
  p_to   timestamptz
) returns table (
  salon             text,
  stylist_count     bigint,
  votes             bigint,
  votes_per_stylist numeric
)
language sql
security definer
set search_path = public
as $$
  with per_stylist as (
    select t.id, t.salon, count(b.id) as votes
    from stylists t
    left join styles s on s.stylist_id = t.id
    left join votes  v on v.style_id = s.id
    left join ballots b
           on b.id = v.ballot_id
          and b.status = 'submitted'
          and (p_from is null or b.submitted_at >= p_from)
          and (p_to   is null or b.submitted_at <  p_to)
    where t.is_active and t.salon is not null
    group by t.id, t.salon
  )
  select salon,
         count(*)    as stylist_count,
         sum(votes)  as votes,
         case when count(*) = 0 then 0
              else round(sum(votes)::numeric / count(*), 2) end
  from per_stylist
  group by salon
  order by 4 desc, 3 desc;
$$;
