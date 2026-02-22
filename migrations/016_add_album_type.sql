alter table public.albums
add column if not exists album_type text not null default 'album';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'albums_album_type_check'
      and conrelid = 'public.albums'::regclass
  ) then
    alter table public.albums
      add constraint albums_album_type_check
      check (album_type in ('album', 'ep', 'single', 'demo'));
  end if;
end $$;
