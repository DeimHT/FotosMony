"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Evento = {
  id: string;
  nombre: string;
  slug: string;
  created_at?: string;
};

type SubEvento = {
  id: string;
  evento_id: string;
  nombre: string;
  slug: string;
  created_at?: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function AdminEventosPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [selectedEventoId, setSelectedEventoId] = useState<string>("");

  const [subeventos, setSubeventos] = useState<SubEvento[]>([]);

  // Crear evento
  const [evNombre, setEvNombre] = useState("");
  const evSlug = useMemo(() => slugify(evNombre), [evNombre]);

  // Crear subevento
  const [subNombre, setSubNombre] = useState("");
  const subSlug = useMemo(() => slugify(subNombre), [subNombre]);

    // Editar evento
    const [editingEventoId, setEditingEventoId] = useState<string | null>(null);
    const [editingEventoNombre, setEditingEventoNombre] = useState("");
    const [editingEventoSlug, setEditingEventoSlug] = useState("");

    // Editar subevento
    const [editingSubEventoId, setEditingSubEventoId] = useState<string | null>(null);
    const [editingSubNombre, setEditingSubNombre] = useState("");
    const [editingSubSlug, setEditingSubSlug] = useState("");


  const [msg, setMsg] = useState<string | null>(null);

  const loadEventos = async (accessToken: string) => {
    const res = await fetch("/api/admin/eventos", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Error cargando eventos");
    setEventos(data.eventos ?? []);
  };

  const loadSubEventos = async (accessToken: string, eventoId: string) => {
    const res = await fetch(`/api/admin/subeventos?evento_id=${encodeURIComponent(eventoId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Error cargando subeventos");
    setSubeventos(data.subeventos ?? []);
  };

  // Boot: sesión + admin + cargar eventos
  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setLoading(true);
      setMsg(null);

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        router.push("/login");
        return;
      }

      // verifica admin por profiles (cliente) para UX rápida
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

      try {
        await loadEventos(session.access_token);
      } catch (e: any) {
        setMsg(e.message ?? "Error");
      } finally {
        setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [router]);

  // Cuando seleccionas evento, carga subeventos
  useEffect(() => {
    if (!token || !selectedEventoId) {
      setSubeventos([]);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const t = token;
        await loadSubEventos(t, selectedEventoId);
      } catch (e: any) {
        if (mounted) setMsg(e.message ?? "Error");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token, selectedEventoId]);

  const handleCreateEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setMsg(null);

    const res = await fetch("/api/admin/eventos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nombre: evNombre.trim(), slug: evSlug }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "No se pudo crear el evento");
      return;
    }

    setEvNombre("");
    await loadEventos(token);
    setMsg("Evento creado ✅");
  };

  const handleCreateSubEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedEventoId) return;

    setMsg(null);

    const res = await fetch("/api/admin/subeventos", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        evento_id: selectedEventoId,
        nombre: subNombre.trim(),
        slug: subSlug,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setMsg(data?.error ?? "No se pudo crear el subevento");
      return;
    }

    setSubNombre("");
    await loadSubEventos(token, selectedEventoId);
    setMsg("SubEvento creado ✅");
  };

  const startEditEvento = (ev: Evento) => {
    setEditingEventoId(ev.id);
    setEditingEventoNombre(ev.nombre);
    setEditingEventoSlug(ev.slug);
    };

    const cancelEditEvento = () => {
    setEditingEventoId(null);
    setEditingEventoNombre("");
    setEditingEventoSlug("");
    };

    const startEditSubEvento = (s: SubEvento) => {
    setEditingSubEventoId(s.id);
    setEditingSubNombre(s.nombre);
    setEditingSubSlug(s.slug);
    };

    const cancelEditSubEvento = () => {
    setEditingSubEventoId(null);
    setEditingSubNombre("");
    setEditingSubSlug("");
    };


    const saveEvento = async () => {
    if (!token || !editingEventoId) return;

    const res = await fetch("/api/admin/eventos", {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        id: editingEventoId,
        nombre: editingEventoNombre.trim(),
        slug: editingEventoSlug.trim(),
        }),
    });

    const json = await res.json();
    if (!res.ok) {
        setMsg(json?.error ?? "No se pudo actualizar evento");
        return;
    }

    setMsg("Evento actualizado ✅");
    cancelEditEvento();
    await loadEventos(token);
    };

    const saveSubEvento = async () => {
    if (!token || !editingSubEventoId || !selectedEventoId) return;

    const res = await fetch("/api/admin/subeventos", {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
        id: editingSubEventoId,
        nombre: editingSubNombre.trim(),
        slug: editingSubSlug.trim(),
        }),
    });

    const json = await res.json();
    if (!res.ok) {
        setMsg(json?.error ?? "No se pudo actualizar subevento");
        return;
    }

    setMsg("SubEvento actualizado ✅");
    cancelEditSubEvento();
    await loadSubEventos(token, selectedEventoId);
    };


  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Admin · Eventos</h1>
        <p className="mt-2 text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin · Eventos</h1>
          <p className="mt-1 text-sm text-slate-600">
            Crea eventos, subeventos y organiza el catálogo.
          </p>
        </div>
        <a
          href="/admin"
          className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          Volver al panel
        </a>
      </div>

      {msg && (
        <div className="mt-4 rounded-xl border bg-white p-3 text-sm text-slate-800">
          {msg}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Crear evento */}
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Crear evento</h2>
          <form onSubmit={handleCreateEvento} className="mt-3 flex flex-col gap-3">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Nombre del evento"
              value={evNombre}
              onChange={(e) => setEvNombre(e.target.value)}
              required
            />
            <input
              className="rounded-xl border bg-slate-50 px-3 py-2 text-sm"
              value={evSlug}
              readOnly
            />
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Crear evento
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            El slug se genera automáticamente (puedes mejorarlo después con edición).
          </p>
        </div>

        {/* Lista + seleccionar evento */}
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Eventos</h2>

          <div className="mt-3">
            <select
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={selectedEventoId}
              onChange={(e) => setSelectedEventoId(e.target.value)}
            >
              <option value="">Selecciona un evento…</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.nombre} ({ev.slug})
                </option>
              ))}
            </select>
          </div>

          <div className="mt-3 max-h-64 overflow-auto rounded-xl border">
            {eventos.length === 0 ? (
              <p className="p-3 text-sm text-slate-600">Aún no hay eventos.</p>
            ) : (
              <ul className="divide-y">
                {eventos.map((ev) => (
                  <li key={ev.id} className="p-3">
                    {editingEventoId === ev.id ? (
                        <div className="flex flex-col gap-2">
                        <input
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={editingEventoNombre}
                            onChange={(e) => setEditingEventoNombre(e.target.value)}
                        />
                        <input
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={editingEventoSlug}
                            onChange={(e) => setEditingEventoSlug(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <button
                            type="button"
                            onClick={saveEvento}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                            Guardar
                            </button>
                            <button
                            type="button"
                            onClick={cancelEditEvento}
                            className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                            >
                            Cancelar
                            </button>
                        </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{ev.nombre}</p>
                            <p className="text-xs text-slate-600">{ev.slug}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => startEditEvento(ev)}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                        >
                            Editar
                        </button>
                        </div>
                    )}
                    </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* SubEventos */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Crear subevento</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedEventoId ? "Asociado al evento seleccionado." : "Primero selecciona un evento."}
          </p>

          <form onSubmit={handleCreateSubEvento} className="mt-3 flex flex-col gap-3">
            <input
              className="rounded-xl border px-3 py-2 text-sm"
              placeholder="Nombre del subevento"
              value={subNombre}
              onChange={(e) => setSubNombre(e.target.value)}
              required
              disabled={!selectedEventoId}
            />
            <input
              className="rounded-xl border bg-slate-50 px-3 py-2 text-sm"
              value={subSlug}
              readOnly
              disabled={!selectedEventoId}
            />
            <button
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={!selectedEventoId}
            >
              Crear subevento
            </button>
          </form>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-base font-semibold text-slate-900">Subeventos</h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedEventoId ? "Del evento seleccionado." : "Selecciona un evento para verlos."}
          </p>

          <div className="mt-3 max-h-64 overflow-auto rounded-xl border">
            {!selectedEventoId ? (
              <p className="p-3 text-sm text-slate-600">Sin evento seleccionado.</p>
            ) : subeventos.length === 0 ? (
              <p className="p-3 text-sm text-slate-600">No hay subeventos todavía.</p>
            ) : (
              <ul className="divide-y">
                {subeventos.map((s) => (
                  <li key={s.id} className="p-3">
                    {editingSubEventoId === s.id ? (
                        <div className="flex flex-col gap-2">
                        <input
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={editingSubNombre}
                            onChange={(e) => setEditingSubNombre(e.target.value)}
                        />
                        <input
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={editingSubSlug}
                            onChange={(e) => setEditingSubSlug(e.target.value)}
                        />

                        <div className="flex gap-2">
                            <button
                            type="button"
                            onClick={saveSubEvento}
                            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                            Guardar
                            </button>
                            <button
                            type="button"
                            onClick={cancelEditSubEvento}
                            className="rounded-lg border px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                            >
                            Cancelar
                            </button>
                        </div>
                        </div>
                    ) : (
                        <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{s.nombre}</p>
                            <p className="text-xs text-slate-600">{s.slug}</p>
                        </div>

                        <button
                            type="button"
                            onClick={() => startEditSubEvento(s)}
                            className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                        >
                            Editar
                        </button>
                        </div>
                    )}
                    </li>

                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
