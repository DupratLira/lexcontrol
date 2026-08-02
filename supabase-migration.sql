-- LexControl · Migraciones opcionales
-- Corre esto en el SQL Editor de tu proyecto Supabase
-- (https://supabase.com/dashboard/project/nqykhdxnwwkzjeltlbnu/sql/new)
-- Es seguro: solo agrega cosas nuevas, no borra ni modifica datos existentes.

-- 1) Columna para poder "concluir" un expediente sin borrarlo.
--    Sin esta columna, "Concluir" solo funciona en el dispositivo actual.
alter table public.expedientes
  add column if not exists concluido boolean not null default false;

-- 2) Tabla de bitácora de actuaciones por expediente.
--    Sin esta tabla, la bitácora solo se guarda en el dispositivo actual.
create table if not exists public.actuaciones (
  id uuid primary key default gen_random_uuid(),
  expediente_id uuid not null references public.expedientes(id) on delete cascade,
  descripcion text not null,
  created_by_email text,
  created_at timestamptz not null default now()
);

alter table public.actuaciones enable row level security;

-- Mismos permisos que la tabla expedientes: cualquier usuario autenticado
-- del despacho puede leer y escribir. Ajusta esta política si más adelante
-- quieres restringir por usuario.
create policy if not exists "Usuarios autenticados pueden leer actuaciones"
  on public.actuaciones for select
  to authenticated
  using (true);

create policy if not exists "Usuarios autenticados pueden crear actuaciones"
  on public.actuaciones for insert
  to authenticated
  with check (true);

create index if not exists actuaciones_expediente_id_idx on public.actuaciones(expediente_id);
