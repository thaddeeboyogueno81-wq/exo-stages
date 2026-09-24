-- =============================================================
-- Lify — Schéma PostgreSQL (Supabase)
-- Version 1 : comptes, profils, messagerie, stories/reels,
-- catalogue musique/vidéo, livres, favoris, quotas, signalements.
-- À exécuter dans l'éditeur SQL de Supabase.
-- =============================================================

-- Extensions ---------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Types énumérés ----------------------------------------------
create type media_kind as enum ('image', 'video', 'audio');
create type post_type as enum ('story', 'reel');
create type catalog_category as enum ('music', 'video', 'book');
create type report_status as enum ('open', 'reviewing', 'removed', 'dismissed');
create type report_target as enum ('post', 'message', 'profile', 'media');

-- PROFILS ------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null default '',
  bio text not null default '',
  avatar_url text,
  interests text[] not null default '{}',
  role text not null default 'user' check (role in ('user', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "profils visibles par tous" on profiles for select using (true);
create policy "chacun modifie son profil" on profiles for update using (auth.uid() = id);

-- Trigger : créer le profil à l'inscription
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- FOLLOWS (abonnements) ----------------------------------------
create table follows (
  follower_id uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
alter table follows enable row level security;
create policy "abonnements visibles" on follows for select using (true);
create policy "on s'abonne soi-même" on follows for insert with check (auth.uid() = follower_id);
create policy "on se désabonne soi-même" on follows for delete using (auth.uid() = follower_id);

-- CONVERSATIONS ------------------------------------------------
create table conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table conversation_participants (
  conversation_id uuid not null references conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table conversation_participants enable row level security;
create policy "participants voient leur conversation" on conversation_participants
  for select using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = conversation_id and cp.user_id = auth.uid()
    )
  );
create policy "on rejoint soi-même" on conversation_participants
  for insert with check (user_id = auth.uid());
create policy "on met à jour sa propre lecture" on conversation_participants
  for update using (user_id = auth.uid());

alter table conversations enable row level security;
create policy "conversations visibles des participants" on conversations
  for select using (
    exists (
      select 1 from conversation_participants cp
      where cp.conversation_id = id and cp.user_id = auth.uid()
    )
  );
create policy "créer une conversation" on conversations for insert with check (true);

create or replace function public.is_participant(p_conversation uuid)
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = p_conversation and user_id = auth.uid()
  );
$$;

-- MESSAGES ----------------------------------------------------
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null default '',
  image_url text,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  check (content <> '' or image_url is not null)
);
alter table messages enable row level security;
create policy "messages visibles des participants" on messages
  for select using (public.is_participant(conversation_id));
create policy "envoi de message par un participant" on messages
  for insert with check (sender_id = auth.uid() and public.is_participant(conversation_id));

-- Publications + messages en temps réel
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table posts;

-- PUBLICATIONS (stories & reels) --------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  type post_type not null,
  caption text not null default '',
  media_url text not null,
  media_kind media_kind not null,
  expires_at timestamptz, -- stories : now() + 24 h ; reels : null
  created_at timestamptz not null default now()
);
alter table posts enable row level security;
create policy "publications visibles" on posts
  for select using (
    expires_at is null or expires_at > now() -- les stories expirent
  );
create policy "publier sur son compte" on posts
  for insert with check (author_id = auth.uid());
create policy "supprimer sa publication" on posts
  for delete using (author_id = auth.uid());
create index posts_feed_idx on posts (created_at desc);
create index posts_author_idx on posts (author_id, created_at desc);

-- LIKES -------------------------------------------------------
create table likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table likes enable row level security;
create policy "likes visibles" on likes for select using (true);
create policy "on like avec son compte" on likes
  for insert with check (user_id = auth.uid());
create policy "on retire son like" on likes for delete using (user_id = auth.uid());

-- COMMENTAIRES ------------------------------------------------
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table comments enable row level security;
create policy "commentaires visibles" on comments for select using (true);
create policy "commenter avec son compte" on comments
  for insert with check (author_id = auth.uid());
create policy "supprimer son commentaire" on comments
  for delete using (author_id = auth.uid());

-- CATALOGUE (musique / vidéo / livres, licences libres) ---------
create table media_contents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  creator_credit text not null default '',
  category catalog_category not null,
  description text not null default '',
  license text not null default 'Domaine public'
    check (license in ('Domaine public', 'Creative Commons', 'Créateur indépendant', 'Partenaire')),
  media_kind media_kind not null,
  media_url text not null,          -- fichier audio / vidéo
  cover_url text,
  book_url text,                    -- texte intégral du livre (URL)
  uploader_id uuid references profiles(id) on delete set null,
  duration_seconds int,
  created_at timestamptz not null default now()
);
alter table media_contents enable row level security;
create policy "catalogue visible par tous" on media_contents for select using (true);
create policy "creators ajoutent au catalogue" on media_contents
  for insert with check (auth.uid() is not null and uploader_id = auth.uid());
create policy "on modifie son ajout" on media_contents
  for update using (uploader_id = auth.uid());
create policy "on supprime son ajout" on media_contents
  for delete using (uploader_id = auth.uid());

-- FAVORIS -----------------------------------------------------
create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  media_id uuid not null references media_contents(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, media_id)
);
alter table favorites enable row level security;
create policy "favoris visibles" on favorites for select using (true);
create policy "on gère ses favoris" on favorites
  for insert with check (user_id = auth.uid());
create policy "on retire ses favoris" on favorites
  for delete using (user_id = auth.uid());

-- PLAYLISTS ---------------------------------------------------
create table playlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);
alter table playlists enable row level security;
create policy "playlists visibles" on playlists for select using (true);
create policy "on crée sa playlist" on playlists for insert with check (owner_id = auth.uid());
create policy "on supprime sa playlist" on playlists for delete using (owner_id = auth.uid());

create table playlist_items (
  playlist_id uuid not null references playlists(id) on delete cascade,
  media_id uuid not null references media_contents(id) on delete cascade,
  position int not null default 0,
  added_at timestamptz not null default now(),
  primary key (playlist_id, media_id)
);
alter table playlist_items enable row level security;
create policy "contenu des playlists visible" on playlist_items for select using (true);
create policy "ajout via sa playlist" on playlist_items
  for insert with check (
    exists (select 1 from playlists p where p.id = playlist_id and p.owner_id = auth.uid())
  );
create policy "retrait via sa playlist" on playlist_items
  for delete using (
    exists (select 1 from playlists p where p.id = playlist_id and p.owner_id = auth.uid())
  );

-- PROGRESSION DE LECTURE (livres) -------------------------------
create table reading_progress (
  user_id uuid not null references profiles(id) on delete cascade,
  media_id uuid not null references media_contents(id) on delete cascade,
  position int not null default 0,   -- index de paragraphe
  updated_at timestamptz not null default now(),
  primary key (user_id, media_id)
);
alter table reading_progress enable row level security;
create policy "sa progression visible" on reading_progress
  for select using (user_id = auth.uid());
create policy "maj de sa progression" on reading_progress
  for insert with check (user_id = auth.uid());
create policy "maj de sa progression" on reading_progress
  for update using (user_id = auth.uid());

-- SIGNALEMENTS (modération, retrait < 48 h) ---------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  target_type report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 1 and 500),
  status report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
alter table reports enable row level security;
create policy "on signale avec son compte" on reports
  for insert with check (reporter_id = auth.uid());
create policy "les modérateurs consultent les signalements" on reports
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );
create policy "les modérateurs traitent les signalements" on reports
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('moderator', 'admin')
    )
  );

-- QUOTAS DU MODE GRATUIT ----------------------------------------
-- Une ligne par utilisateur et par jour ; consommée via consume_quota().
create table usage_log (
  user_id uuid not null references profiles(id) on delete cascade,
  day date not null default current_date,
  media_plays int not null default 0,  -- lectures/écoutes du jour
  books_opened int not null default 0,  -- livres ouverts ce mois (day = 1er du mois)
  primary key (user_id, day)
);
alter table usage_log enable row level security;
create policy "chacun voit sa consommation" on usage_log
  for select using (user_id = auth.uid());

-- RPC : décrémente le quota et répond true si l'action est autorisée.
create or replace function public.consume_quota(p_kind text)
returns boolean
language plpgsql
security definer set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_row usage_log;
  v_day date := current_date;
  v_month_start date := date_trunc('month', current_date)::date;
begin
  if v_user is null then
    return false;
  end if;

  if p_kind = 'media' then
    insert into usage_log (user_id, day, media_plays)
      values (v_user, v_day, 1)
      on conflict (user_id, day)
      do update set media_plays = usage_log.media_plays + 1
      returning * into v_row;
    return v_row.media_plays <= 20; -- 20 écoutes/lectures par jour en mode gratuit
  elsif p_kind = 'book' then
    insert into usage_log (user_id, day, books_opened)
      values (v_user, v_month_start, 1)
      on conflict (user_id, day)
      do update set books_opened = usage_log.books_opened + 1
      returning * into v_row;
    return v_row.books_opened <= 3; -- 3 nouveaux livres par mois en mode gratuit
  end if;

  return false;
end;
$$;

-- Vue pratique pour l'interface : consommation du jour
create or replace function public.today_usage()
returns table (media_plays int, media_limit int, books_opened int, books_limit int)
language sql
security definer set search_path = public
stable
as $$
  select
    coalesce(u.media_plays, 0),
    20,
    (select coalesce(max(books_opened), 0) from usage_log
       where user_id = auth.uid()
         and day = date_trunc('month', current_date)::date),
    3
  from usage_log u
  where u.user_id = auth.uid() and u.day = current_date
  limit 1;
$$;
