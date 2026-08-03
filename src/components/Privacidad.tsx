export default function Privacidad() {
  return (
    <div className="min-h-screen bg-cream px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl text-navy-900">Aviso de Privacidad — LexControl</h1>
          <p className="text-xs text-navy-900/40 mt-1">Última actualización: agosto de 2026</p>
        </div>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">¿Quién opera esta aplicación?</h2>
          <p className="text-sm text-navy-900/70">
            LexControl es una herramienta de uso interno de <strong>Duprat Lira Abogados</strong>,
            ubicado en Insurgentes Sur 300, Roma Norte, CDMX, teléfono 55 5160-1668. Su propósito
            es el control y seguimiento de expedientes jurídicos del despacho.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">¿Qué datos se recopilan?</h2>
          <ul className="text-sm text-navy-900/70 list-disc pl-5 space-y-1">
            <li>Datos de la cuenta de acceso: correo electrónico y contraseña (gestionados de forma segura por nuestro proveedor de base de datos, Supabase).</li>
            <li>Información de expedientes jurídicos capturada por el personal autorizado del despacho: partes, juzgados, fechas, estatus procesal y notas de seguimiento.</li>
            <li>Si el usuario decide usar la función "Sincronizar con Google Calendar", se solicita autorización explícita a través de su cuenta de Google para crear eventos de calendario relacionados con vencimientos de expedientes. No se accede a ninguna otra información de la cuenta de Google del usuario.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">¿Cómo se protegen los datos?</h2>
          <p className="text-sm text-navy-900/70">
            Toda la información se transmite de forma cifrada (HTTPS) y se almacena en una base de
            datos con controles de acceso por rol. Solo el personal autorizado del despacho puede
            crear cuentas de acceso; el registro público de usuarios está deshabilitado.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">¿Con quién se comparte la información?</h2>
          <p className="text-sm text-navy-900/70">
            La información de los expedientes no se comparte con terceros, salvo con los
            proveedores de infraestructura necesarios para operar la aplicación (Supabase para
            base de datos y autenticación, Vercel para hosting, y Google para la sincronización
            opcional de calendario cuando el usuario la activa).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">Derechos del usuario</h2>
          <p className="text-sm text-navy-900/70">
            Cualquier usuario puede solicitar la corrección o eliminación de sus datos de cuenta
            contactando al administrador del sistema en el despacho, al teléfono 55 5160-1668.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-semibold text-navy-900 text-sm">Contacto</h2>
          <p className="text-sm text-navy-900/70">
            Duprat Lira Abogados — Insurgentes Sur 300, Roma Norte, CDMX — Tel: 55 5160-1668.
          </p>
        </section>
      </div>
    </div>
  );
}
