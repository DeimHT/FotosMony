import Link from "next/link";

const WHATSAPP_URL =
  "https://wa.me/569XXXXXXXX?text=Hola%20FotosMony%2C%20me%20gustar%C3%ADa%20reservar%20una%20sesi%C3%B3n%20%F0%9F%93%B7";

export function CTAFinal() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-24">
      <div className="relative overflow-hidden rounded-3xl border bg-white p-10 shadow-sm">
        {/* Fondo decorativo suave */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-slate-100" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-slate-100" />

        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900">
              ¿Listo para capturar tu próximo momento?
            </h2>
            <p className="mt-3 max-w-xl text-slate-600">
              Escríbenos y cuéntanos tu idea. Te ayudamos a planificar la sesión,
              definir locación, estilo y entrega. Reservas rápidas y atención personalizada.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition"
              >
                Reservar sesión
              </Link>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition"
              >
                Hablar por WhatsApp
              </a>
            </div>
          </div>

          {/* Bloque “mini beneficios” */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Entrega rápida</p>
              <p className="mt-1 text-sm text-slate-600">
                Galerías organizadas y entrega digital sin complicaciones.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Calidad pro</p>
              <p className="mt-1 text-sm text-slate-600">
                Edición cuidada y archivos en alta resolución.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Atención cercana</p>
              <p className="mt-1 text-sm text-slate-600">
                Coordinamos horarios, locación y estilo contigo.
              </p>
            </div>
            <div className="rounded-2xl border bg-white p-5">
              <p className="text-sm font-semibold text-slate-900">Pagos seguros</p>
              <p className="mt-1 text-sm text-slate-600">
                Compra de fotos por evento con entrega por correo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
