import { createClient } from "@supabase/supabase-js";

export const revalidate = 60;

export const metadata = {
  title: "Servicios",
  description:
    "Servicios de fotografía FotosMony: sesiones fotográficas, bodas, retratos, impresión y venta de fotos digitales en la Región de los Lagos.",
};

type Service = {
  id: string;
  title: string;
  description: string | null;
  price_clp: number;
  image_url: string | null;
  image_public_id: string | null;
};

export default async function ServiciosPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data } = await supabase
    .from("services")
    .select("id,title,description,price_clp, image_url, image_public_id")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  const money = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-slate-900">Servicios</h1>
        <p className="mt-2 text-slate-600">
          Conoce los servicios que ofrecemos y sus detalles.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((s: Service) => (
          <div
            key={s.id}
            className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
          >
            {/* Imagen (placeholder por ahora) */}
            <div className="aspect-[4/3] w-full bg-slate-200">
              <img
                src={s.image_url || "/placeholder-service.jpg"}
                alt={s.title}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Contenido */}
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  📷
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {s.title}
                </h2>
              </div>

              {s.description && (
                <p className="mt-4 text-sm text-slate-600">
                  {s.description}
                </p>
              )}

              {/* Precio (solo si > 0) */}
              {s.price_clp > 0 && (
                <p className="mt-4 text-xl font-semibold text-slate-900">
                  {money.format(s.price_clp)}
                </p>
              )}

              {/* CTA */}
              <button className="mt-auto w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                Ver detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
