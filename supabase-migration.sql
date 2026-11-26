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

-- ============================================================
-- Módulo "Informes clientes" (aplicada en Supabase el 25-11-2026)
-- ============================================================
-- create table public.clientes (id bigint generated always as identity primary key, nombre text not null unique,
--   rfc text, contacto text, notas_internas text, estrategia_general text, created_at timestamptz not null default now());
-- alter table public.expedientes add column cliente_id bigint references public.clientes(id),
--   add column posicion_cliente text check (posicion_cliente in ('actor','demandado','tercero','quejoso','otro')),
--   add column carpeta_drive_url text, add column resumen_cliente text;
-- create table public.expedientes_interno (expediente_id bigint primary key references public.expedientes(id) on delete cascade,
--   estrategia_interna text, nivel_riesgo text check (nivel_riesgo in ('bajo','medio','alto','critico')),
--   monto_riesgo numeric, notas text, updated_at timestamptz not null default now());   -- RLS: solo staff
-- alter table public.actuaciones add column visible_cliente boolean not null default false, add column fecha date default current_date;
-- política act_select: el cliente solo ve actuaciones con visible_cliente = true
-- create table public.informes (...); create table public.informe_expedientes (...);  -- RLS: solo staff

-- Honorarios por cliente (aplicada 26-11-2026). RLS: solo staff.
-- create table public.honorarios (id bigint generated always as identity primary key, cliente_id bigint not null references public.clientes(id),
--   expediente_id bigint references public.expedientes(id), concepto text not null, monto numeric not null,
--   fecha_pago date /* null = pendiente */, evento text, notas text, created_by_email text, created_at timestamptz not null default now());
