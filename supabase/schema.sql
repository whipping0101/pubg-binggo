create table if not exists public.bingo_rooms (
  id text primary key,
  board_mission_ids integer[] not null default '{}',
  completed_ids integer[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.bingo_rooms enable row level security;

create policy "bingo_rooms_select"
  on public.bingo_rooms
  for select
  using (true);

create policy "bingo_rooms_insert"
  on public.bingo_rooms
  for insert
  with check (true);

create policy "bingo_rooms_update"
  on public.bingo_rooms
  for update
  using (true);
