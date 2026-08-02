# LexControl · Duprat Lira Abogados

App de control interno de expedientes, conectada a la base de datos real (Supabase) del despacho. React + TypeScript + Vite + Tailwind CSS. Instalable como PWA en celular y escritorio.

## Qué es real aquí

- **Base de datos real:** se conecta al mismo proyecto Supabase que usa `lexcontrol-final-x0fg.bolt.host` (tabla `expedientes`, 142+ casos). No es una copia ni datos de ejemplo: es la misma información en vivo.
- **Login real:** con tu correo y contraseña de Supabase (Auth). Sin iniciar sesión no se ve ningún dato — eso lo controla Row Level Security en la base de datos, no la app.
- **Sincronización entre dispositivos:** los cambios que haces en un expediente se guardan en Supabase y se reflejan automáticamente en cualquier otro dispositivo con la sesión abierta (suscripción en tiempo real).
- **Instalable en celular:** ver sección PWA abajo.

## Requisitos

- Node.js 18+
- Una cuenta con acceso al proyecto Supabase `nqykhdxnwwkzjeltlbnu` (ya la tienes, es la del despacho).

## Instalación y uso local

```bash
npm install
npm run dev
```

Abre la URL que te muestra la terminal e inicia sesión con tu correo y contraseña habituales.

## Compilar para producción

```bash
npm run build
npm run preview
```

Genera la carpeta `dist/` lista para subir a cualquier hosting estático.

## Desplegar en Vercel (recomendado)

1. Crea una cuenta gratuita en https://vercel.com (puedes entrar con GitHub o correo).
2. Opción fácil sin usar terminal: en vercel.com → "Add New" → "Project" → "Deploy" y arrastra la carpeta `dist/` (después de correr `npm run build`) — Vercel también permite "Deploy" arrastrando una carpeta directamente en algunos flujos, o usa la opción "Import" subiendo el proyecto a GitHub primero.
3. Opción con terminal (más confiable):
   ```bash
   npm install -g vercel
   npm run build
   vercel deploy --prebuilt dist --prod
   ```
   Sigue las instrucciones en pantalla (te pedirá iniciar sesión la primera vez). Al final te da una URL como `https://lexcontrol-xxxx.vercel.app`.
4. Si más adelante compras un dominio propio (ej. `control.dupratlira.com`), lo conectas desde el panel de Vercel → Settings → Domains.

## Instalar en un celular (PWA)

- **Android (Chrome):** abre la URL desplegada, aparece un banner "Instalar" (o menú ⋮ → "Instalar aplicación").
- **iPhone/iPad (Safari):** botón Compartir → "Agregar a pantalla de inicio".

Solo funciona con la app servida por HTTPS (por eso el paso de desplegar en Vercel es necesario para instalarla de verdad en un celular).

## Migraciones opcionales de base de datos

Dos funciones necesitan columnas/tablas que **no existen todavía** en tu base de datos actual:

1. **Concluir expediente de forma permanente** (columna `concluido`).
2. **Bitácora de actuaciones sincronizada entre dispositivos** (tabla `actuaciones`).

Sin correr la migración, ambas funciones siguen operando pero solo en el dispositivo donde las uses (no se sincronizan). Para activarlas de forma permanente:

1. Entra a https://supabase.com/dashboard/project/nqykhdxnwwkzjeltlbnu/sql/new
2. Copia y pega el contenido del archivo `supabase-migration.sql` (incluido en este paquete).
3. Dale "Run". Es seguro: solo agrega columnas/tablas nuevas, no borra ni modifica nada existente.

## Qué incluye la app

- Dashboard con estadísticas en vivo (expedientes totales, amparos activos, apelaciones, escritos pendientes, vencimientos urgentes, congelados).
- Distribución por materia (Civil, Familiar, Laboral, Administrativa).
- Buscador y filtros por materia y por indicador.
- Tabla de expedientes con los datos reales del despacho.
- Vista de detalle completa: situación actual, próximo paso, fecha límite (con botón para Google Calendar), datos de amparo (número, juzgado, tipo), datos de apelación (sala, toca, tipo), escrito pendiente (tipo y fecha límite), expediente físico, bitácora de actuaciones, y quién hizo el último cambio.
- Formulario "Nuevo Expediente".
- Pestañas de Calendario y Escritos.
- Exportación a ZIP (CSV + JSON).
- Cerrar sesión real.

## Notas técnicas

- La conexión a Supabase usa la URL y la "anon key" del proyecto — están pensadas para ser públicas en el código del cliente; el acceso real a los datos lo controla Row Level Security dentro de Supabase, no el secreto de esta llave.
- Si en el futuro quieres agregar más usuarios (otros abogados del despacho), créalos desde el panel de Supabase → Authentication → Users → Add user.
