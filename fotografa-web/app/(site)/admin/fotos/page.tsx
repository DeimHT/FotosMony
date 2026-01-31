"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { cldUrl } from "FotosMony/lib/cloudinaryUrl";

type Evento = { id: string; nombre: string; slug: string };
type SubEvento = { id: string; evento_id: string; nombre: string; slug: string };

type Foto = {
  id: string;
  public_id: string;
  precio: number;
  nombre_archivo: string | null;
  evento_id: string | null;
  sub_evento_id: string | null;
};

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

  const [fotosDelEvento, setFotosDelEvento] = useState<Foto[]>([]);
  const [loadingFotos, setLoadingFotos] = useState(false);
  const [deletingFotoId, setDeletingFotoId] = useState<string | null>(null);

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

  // cargar fotos del evento o subevento seleccionado
  useEffect(() => {
    if (!token) {
      setFotosDelEvento([]);
      return;
    }
    if (!eventoId && !subEventoId) {
      setFotosDelEvento([]);
      return;
    }

    let mounted = true;
    setLoadingFotos(true);

    const params = subEventoId
      ? `sub_evento_id=${encodeURIComponent(subEventoId)}`
      : `evento_id=${encodeURIComponent(eventoId)}`;

    fetch(`/api/admin/fotos?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((json) => {
        if (mounted && json.fotos) setFotosDelEvento(json.fotos);
      })
      .catch(() => {
        if (mounted) setFotosDelEvento([]);
      })
      .finally(() => {
        if (mounted) setLoadingFotos(false);
      });

    return () => {
      mounted = false;
    };
  }, [token, eventoId, subEventoId]);

  const loadFotosDelEvento = async () => {
    if (!token || (!eventoId && !subEventoId)) return;
    const params = subEventoId
      ? `sub_evento_id=${encodeURIComponent(subEventoId)}`
      : `evento_id=${encodeURIComponent(eventoId)}`;
    const res = await fetch(`/api/admin/fotos?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (res.ok) setFotosDelEvento(json.fotos ?? []);
  };

  const deleteFoto = async (fotoId: string) => {
    if (!token) return;
    if (!confirm("¿Eliminar esta foto? Se borrará de Cloudinary y de la base de datos.")) return;
    setDeletingFotoId(fotoId);
    try {
      const res = await fetch(`/api/admin/fotos/${fotoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json?.error ?? "No se pudo eliminar");
        return;
      }
      await loadFotosDelEvento();
    } finally {
      setDeletingFotoId(null);
    }
  };

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
    if (eventoId || subEventoId) await loadFotosDelEvento();
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

      {/* Fotos del evento/subevento seleccionado */}
      <div className="mt-8 rounded-2xl border bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Fotos del evento o subevento</h2>
        <p className="mt-1 text-sm text-slate-600">
          Selecciona un evento (y opcionalmente un subevento) para ver y eliminar fotos.
        </p>

        {!eventoId && !subEventoId ? (
          <p className="mt-4 text-sm text-slate-500">Selecciona un evento arriba para ver sus fotos.</p>
        ) : loadingFotos ? (
          <p className="mt-4 text-sm text-slate-600">Cargando fotos…</p>
        ) : fotosDelEvento.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No hay fotos en este evento/subevento.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {fotosDelEvento.map((foto) => (
              <div
                key={foto.id}
                className="group relative overflow-hidden rounded-xl border bg-slate-50"
              >
                <img
                  src={cldUrl(foto.public_id, 400)}
                  alt={foto.nombre_archivo ?? foto.public_id}
                  className="block w-full aspect-square object-cover"
                />
                <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/70 to-transparent opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => deleteFoto(foto.id)}
                    disabled={deletingFotoId === foto.id}
                    className="mb-2 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {deletingFotoId === foto.id ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
                <p className="truncate p-2 text-xs text-slate-600">
                  {foto.nombre_archivo ?? foto.public_id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
