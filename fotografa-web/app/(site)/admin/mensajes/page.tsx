"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { AdminHelpBox } from "FotosMony/components/ui/AdminHelpBox";

type Mensaje = {
  id: string;
  nombre: string;
  email: string;
  asunto: string | null;
  mensaje: string;
  leido: boolean;
  created_at: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default function AdminMensajesPage() {
  const router = useRouter();
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const fetchMensajes = async () => {
    setErrorMsg(null);
    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.session.user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      router.push("/");
      setLoading(false);
      return;
    }

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/contact-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setMensajes(data.mensajes ?? []);
      } else {
        setErrorMsg(data?.error ?? "No se pudieron cargar los mensajes.");
        setMensajes([]);
      }
    } catch {
      setErrorMsg("Error de conexión.");
      setMensajes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensajes();
  }, [router]);

  const toggleLeido = async (id: string, leido: boolean) => {
    const token = await getToken();
    if (!token) return;

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leido: !leido }),
      });

      if (res.ok) {
        setMensajes((prev) =>
          prev.map((m) => (m.id === id ? { ...m, leido: !leido } : m))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const noLeidos = mensajes.filter((m) => !m.leido).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mensajes de contacto</h1>
          <p className="mt-1 text-sm text-slate-600">
            Mensajes enviados desde el formulario de contacto.
            {noLeidos > 0 && (
              <span className="ml-2 font-medium text-slate-900">
                {noLeidos} sin leer
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Volver al panel
        </Link>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {errorMsg}
          <button
            type="button"
            onClick={() => fetchMensajes()}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6">
        <AdminHelpBox
          title="¿Cómo funcionan los mensajes?"
          items={[
            "Aquí aparecen los mensajes que la gente envía desde el formulario de contacto de tu sitio.",
            "Los mensajes nuevos aparecen con la etiqueta 'Sin leer' para que sepas cuáles revisar.",
            "Haz clic en 'Marcar como leído' cuando ya hayas visto o respondido un mensaje.",
            "Puedes hacer clic en el email del remitente para responderle directamente desde tu correo.",
            "Los mensajes se ordenan del más nuevo al más antiguo.",
          ]}
        />
      </div>

      {loading ? (
        <p className="mt-6 text-slate-600">Cargando...</p>
      ) : mensajes.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-6 py-12 text-center text-slate-600">
          No hay mensajes de contacto.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {mensajes.map((m) => (
            <article
              key={m.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition ${
                !m.leido ? "border-slate-300 bg-slate-50/50" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{m.nombre}</span>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-sm text-slate-600 underline hover:text-slate-900"
                    >
                      {m.email}
                    </a>
                    {!m.leido && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Sin leer
                      </span>
                    )}
                  </div>
                  {m.asunto && (
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Asunto: {m.asunto}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
                    {m.mensaje}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(m.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleLeido(m.id, m.leido)}
                  disabled={updatingId === m.id}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  {updatingId === m.id
                    ? "..."
                    : m.leido
                      ? "Marcar como no leído"
                      : "Marcar como leído"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
