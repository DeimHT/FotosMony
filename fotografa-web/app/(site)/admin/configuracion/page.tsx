"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "FotosMony/lib/supabaseClient";
import { AdminHelpBox } from "FotosMony/components/ui/AdminHelpBox";

export default function AdminConfiguracionPage() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) {
        router.push("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .maybeSingle();
      if (mounted && profile?.role !== "admin") {
        router.push("/");
        return;
      }
      if (mounted) setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  async function handleUploadWatermark() {
    setMessage(null);
    setUploading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setMessage({ type: "error", text: "No hay sesión. Inicia sesión de nuevo." });
        setUploading(false);
        return;
      }

      const res = await fetch("/api/admin/upload-watermark", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      let body: { error?: string; message?: string };
      try {
        body = await res.json();
      } catch {
        body = {};
      }

      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Error al subir la marca de agua." });
        setUploading(false);
        return;
      }

      setMessage({
        type: "ok",
        text: body.message ?? "Marca de agua subida. Agrega en .env.local: NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID=watermark y reinicia el servidor.",
      });
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Panel
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
      </div>

      <div className="mb-6">
        <AdminHelpBox
          title="¿Cómo funciona la configuración?"
          items={[
            "La marca de agua es tu logo o texto que aparece sobre las fotos de los eventos.",
            "Esto evita que la gente descargue las fotos sin pagar (cuando compran, reciben la foto sin marca).",
            "Solo necesitas subir la marca de agua una vez. Después se aplica automáticamente a todas las fotos.",
            "Si cambias tu logo, sube la nueva marca de agua y se actualizará en todas las fotos.",
          ]}
        />
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Marca de agua (galería de eventos)</h2>
        <p className="mt-1 text-sm text-slate-600">
          La imagen <code className="rounded bg-slate-100 px-1">public/watermark.png</code> se usa como marca de agua en las fotos de la galería de eventos. Súbela a Cloudinary para que se aplique en todas las vistas.
        </p>

        <div className="mt-4">
          <button
            type="button"
            onClick={handleUploadWatermark}
            disabled={uploading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {uploading ? "Subiendo…" : "Subir marca de agua a Cloudinary"}
          </button>
        </div>

        {message && (
          <div
            className={`mt-4 rounded-lg border p-3 text-sm ${
              message.type === "ok"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Después de subir, agrega en <code className="rounded bg-slate-100 px-1">.env.local</code>:{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CLOUDINARY_WATERMARK_PUBLIC_ID=watermark</code> y reinicia el servidor.
        </p>
      </div>
    </div>
  );
}
