"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Evento = { id: string; nombre: string; slug: string };
type SubEvento = { id: string; evento_id: string; nombre: string; slug: string };

type UploadRow = {
  name: string;
  status: "pending" | "uploading" | "ok" | "error";
  message?: string;
  secure_url?: string;
  public_id?: string;
};

export default function AdminFotosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [subeventos, setSubeventos] = useState<SubEvento[]>([]);

  const [eventoId, setEventoId] = useState("");
  const [subEventoId, setSubEventoId] = useState("");

  const [precio, setPrecio] = useState<number>(2500);

  const [files, setFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [busy, setBusy] = useState(false);

  const total = rows.length;
  const done = useMemo(
    () => rows.filter((r) => r.status === "ok" || r.status === "error").length,
    [rows]
  );

  // Boot: sesión + check admin + cargar eventos
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        router.push("/login");
        return;
      }

      // check admin (UX)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }

      if (!mounted) return;
      setToken(session.access_token);

      // cargar eventos (desde API admin)
      const res = await fetch("/api/admin/eventos", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      const json = await res.json();
      if (res.ok) setEventos(json.eventos ?? []);
      setLoading(false);
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [router]);

  // cargar subeventos al seleccionar evento
  useEffect(() => {
    if (!token || !eventoId) {
      setSubeventos([]);
      setSubEventoId("");
      return;
    }

    (async () => {
      const res = await fetch(`/api/admin/subeventos?evento_id=${encodeURIComponent(eventoId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok) setSubeventos(json.subeventos ?? []);
      else setSubeventos([]);
    })();
  }, [token, eventoId]);

  const onPickFiles = (f: FileList | null) => {
    const list = f ? Array.from(f) : [];
    setFiles(list);
    setRows(
      list.map((file) => ({
        name: file.name,
        status: "pending",
      }))
    );
  };

  const uploadAll = async () => {
    if (!token) return;

    if (!eventoId && !subEventoId) {
      alert("Selecciona un evento (y opcional subevento).");
      return;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
      alert("Precio inválido.");
      return;
    }

    if (files.length === 0) {
      alert("Selecciona fotos.");
      return;
    }

    setBusy(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // marcar uploading
      setRows((prev) =>
        prev.map((r, idx) => (idx === i ? { ...r, status: "uploading" } : r))
      );

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("precio", String(precio));
        // Si seleccionas subevento, lo usamos; si no, evento
        if (subEventoId) fd.append("sub_evento_id", subEventoId);
        else fd.append("evento_id", eventoId);

        const res = await fetch("/api/admin/fotos/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });

        const json = await res.json();

        if (!res.ok) {
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? { ...r, status: "error", message: json?.error ?? "Error" }
                : r
            )
          );
        } else {
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? {
                    ...r,
                    status: "ok",
                    secure_url: json?.secure_url,
                    public_id: json?.foto?.public_id,
                  }
                : r
            )
          );
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error";
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "error", message: msg } : r))
        );
      }
    }

    setBusy(false);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Admin · Fotos</h1>
        <p className="mt-2 text-slate-600">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · Fotos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Subida múltiple a Cloudinary + guardado en BD.
          </p>
        </div>
        <a
          href="/admin"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Volver al panel
        </a>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Config */}
        <div className="rounded-2xl border bg-white p-4 md:col-span-1">
          <h2 className="text-base font-semibold text-slate-900">Configuración</h2>

          <label className="mt-3 block text-xs font-semibold text-slate-600">Evento</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={eventoId}
            onChange={(e) => setEventoId(e.target.value)}
          >
            <option value="">Selecciona un evento…</option>
            {eventos.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.nombre} ({ev.slug})
              </option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-semibold text-slate-600">Subevento (opcional)</label>
          <select
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={subEventoId}
            onChange={(e) => setSubEventoId(e.target.value)}
            disabled={!eventoId}
          >
            <option value="">— Ninguno —</option>
            {subeventos.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre} ({s.slug})
              </option>
            ))}
          </select>

          <label className="mt-3 block text-xs font-semibold text-slate-600">Precio (CLP)</label>
          <input
            type="number"
            min={1}
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            value={precio}
            onChange={(e) => setPrecio(Number(e.target.value))}
          />

          <label className="mt-3 block text-xs font-semibold text-slate-600">Fotos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            onChange={(e) => onPickFiles(e.target.files)}
          />

          <button
            type="button"
            onClick={uploadAll}
            disabled={busy || files.length === 0 || (!eventoId && !subEventoId)}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {busy ? `Subiendo ${done}/${total}…` : "Subir todas"}
          </button>

          {total > 0 && (
            <div className="mt-3 text-xs text-slate-600">
              Progreso: <span className="font-semibold">{done}/{total}</span>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="rounded-2xl border bg-white p-4 md:col-span-2">
          <h2 className="text-base font-semibold text-slate-900">Estado de subida</h2>

          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">Selecciona fotos para comenzar.</p>
          ) : (
            <div className="mt-3 max-h-[520px] overflow-auto rounded-xl border">
              <ul className="divide-y">
                {rows.map((r, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{r.name}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {r.status === "pending" && "Pendiente"}
                        {r.status === "uploading" && "Subiendo…"}
                        {r.status === "ok" && `OK · ${r.public_id ?? ""}`}
                        {r.status === "error" && `Error · ${r.message ?? ""}`}
                      </p>
                    </div>

                    {r.secure_url ? (
                      <img
                        src={r.secure_url}
                        alt={r.name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-slate-100" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
