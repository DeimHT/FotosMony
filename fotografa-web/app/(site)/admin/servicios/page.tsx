"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { AdminHelpBox } from "FotosMony/components/ui/AdminHelpBox";

type Service = {
  id: string;
  title: string;
  description: string | null;
  price_clp: number;
  active: boolean;
  sort_order: number;
  created_at: string;
  image_url: string | null;
  image_public_id: string | null;
  destacado: boolean;
};

export default function AdminServiciosPage() {
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [items, setItems] = useState<Service[]>([]);

  // crear
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newActive, setNewActive] = useState(true);

  // editar inline
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editActive, setEditActive] = useState(true);

  
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);


  const money = useMemo(
    () =>
      new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }),
    []
  );

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/services", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudieron cargar servicios");
      setLoading(false);
      return;
    }

    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    let alive = true;

    (async () => {
        if (!alive) return;
        await load();
    })();

    return () => {
        alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const createService = async () => {
    setErrorMsg(null);
    setBusyId("create");

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setBusyId(null);
      return;
    }

    let image_url: string | null = null;
    let image_public_id: string | null = null;

    if (newImageFile) {
      const up = await uploadServiceImage(newImageFile);
      image_url = up.image_url;
      image_public_id = up.image_public_id;
    }

    const res = await fetch("/api/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        price_clp: newPrice,
        active: newActive,
        sort_order: 0,
        image_url,
        image_public_id,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo crear el servicio");
      setBusyId(null);
      return;
    }

    setItems((prev) => [data, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setNewPrice(0);
    setNewActive(true);
    setBusyId(null);
    setNewImageFile(null);
  };

  const startEdit = (s: Service) => {
    setEditId(s.id);
    setEditTitle(s.title);
    setEditDesc(s.description ?? "");
    setEditPrice(s.price_clp);
    setEditActive(s.active);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditTitle("");
    setEditDesc("");
    setEditPrice(0);
    setEditActive(true);
    setEditImageFile(null);
  };

  const saveEdit = async (id: string) => {
    if (!id || id === "undefined") {
      setErrorMsg("No se pudo guardar: ID inválido del servicio");
      return;
    }

    setErrorMsg(null);
    setBusyId(id);

    const current = items.find((x) => x.id === id);
    if (!current) {
      setErrorMsg("No se encontró el servicio en el estado. Prueba 'Recargar'.");
      setBusyId(null);
      return;
    }

    let image_url: string | undefined;
    let image_public_id: string | undefined;

    if (editImageFile) {
      const up = await uploadServiceImage(editImageFile, current.image_public_id ?? "");
      image_url = up.image_url;
      image_public_id = up.image_public_id;
    }

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setBusyId(null);
      return;
    }

    const safePrice = Number.isFinite(editPrice) ? editPrice : 0;

    const safeImagePublicId =
      image_public_id && image_public_id !== "undefined" ? image_public_id : undefined;

    const safeImageUrl =
      image_url && image_url !== "undefined" ? image_url : undefined;



    const res = await fetch(`/api/admin/services/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: editTitle,
        description: editDesc,
        price_clp: safePrice,
        active: editActive,
        ...(safeImageUrl ? { image_url: safeImageUrl } : {}),
        ...(safeImagePublicId ? { image_public_id: safeImagePublicId } : {}),
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo guardar");
      setBusyId(null);
      return;
    }


    setItems((prev) => prev.map((x) => (x.id === id ? data : x)));
    cancelEdit();
    setBusyId(null);
    setEditImageFile(null);
  };

  const toggleActive = async (s: Service) => {
    setErrorMsg(null);
    setBusyId(s.id);

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setBusyId(null);
      return;
    }

    const res = await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ active: !s.active }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo actualizar");
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === s.id ? data : x)));
    setBusyId(null);
  };

  const toggleDestacado = async (s: Service) => {
    setErrorMsg(null);
    setBusyId(s.id);

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setBusyId(null);
      return;
    }

    const res = await fetch(`/api/admin/services/${s.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ destacado: !s.destacado }),
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo actualizar");
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.map((x) => (x.id === s.id ? data : x)));
    setBusyId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este servicio?")) return;

    setErrorMsg(null);
    setBusyId(id);

    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setBusyId(null);
      return;
    }

    const res = await fetch(`/api/admin/services/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo eliminar");
      setBusyId(null);
      return;
    }

    setItems((prev) => prev.filter((x) => x.id !== id));
    setBusyId(null);
  };

  const uploadServiceImage = async (file: File, oldPublicId?: string) => {
    const token = await getToken();
    if (!token) throw new Error("Sesión no encontrada");

    const fd = new FormData();
    fd.append("file", file);
    if (oldPublicId) fd.append("old_public_id", oldPublicId);

    const res = await fetch("/api/admin/services/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Error subiendo imagen");
    return data as { image_url: string; image_public_id: string };
  };


  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Servicios</h1>
        <p className="mt-2 text-slate-600">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Servicios</h1>
        <p className="mt-1 text-sm text-slate-600">
          Administra servicios, precios y visibilidad.
        </p>
      </div>

      {errorMsg && (
        <div className="rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold text-red-600">Error</p>
          <p className="mt-1 text-sm text-slate-700">{errorMsg}</p>
        </div>
      )}

      <AdminHelpBox
        title="¿Cómo funcionan los servicios?"
        items={[
          "Los servicios son lo que ofreces a tus clientes (ej: 'Sesión fotográfica', 'Foto carnet', 'Impresión').",
          "Cada servicio aparece en la página de Servicios de tu sitio web.",
          "Puedes poner un precio de referencia (o dejarlo en 0 si prefieres que te contacten para cotizar).",
          "'Activo' significa que se muestra en la web. Desactívalo si quieres ocultarlo temporalmente.",
          "'Destacado' hace que aparezca en la página principal del sitio (máximo 3 destacados).",
          "Puedes subir una imagen para cada servicio. Si no subes ninguna, se usará una imagen por defecto.",
        ]}
      />

      {/* Crear */}
      <div className="rounded-2xl border bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Nuevo servicio</p>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold text-slate-600">Título</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Ej: Sesión fotográfica"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-600">Precio (CLP)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border px-3 py-2"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Descripción</label>
            <textarea
              className="mt-1 w-full rounded-lg border px-3 py-2"
              rows={3}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Detalle breve del servicio…"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Imagen</label>
            <input
              type="file"
              accept="image/*"
              className="mt-1 w-full rounded-lg border px-3 py-2"
              onChange={(e) => setNewImageFile(e.target.files?.[0] ?? null)}
            />
          </div>


          <div className="flex items-center gap-2">
            <input
              id="new-active"
              type="checkbox"
              checked={newActive}
              onChange={(e) => setNewActive(e.target.checked)}
            />
            <label htmlFor="new-active" className="text-sm text-slate-700">
              Activo (visible en la web)
            </label>
          </div>
        </div>

        <button
          disabled={busyId === "create" || !newTitle.trim()}
          onClick={createService}
          className="mt-4 rounded-lg bg-black px-4 py-2 text-white font-medium disabled:opacity-50"
        >
          {busyId === "create" ? "Creando..." : "Crear servicio"}
        </button>
      </div>

      {/* Lista */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900">Servicios</p>
          <button
            onClick={load}
            className="text-sm font-semibold text-slate-900 hover:underline"
          >
            Recargar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-4 text-sm text-slate-600">No hay servicios aún.</div>
        ) : (
          <div className="divide-y">
            {items.map((s) => {
              const editing = editId === s.id;
              return (
                <div key={s.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    {!editing ? (
                      <>
                        <div className="flex items-center gap-2">
                          {s.image_url && (
                            <img src={s.image_url} className="h-10 w-10 rounded-lg object-cover border" />
                          )}

                          <p className="font-semibold text-slate-900 truncate">{s.title}</p>
                          <span className={`text-xs rounded-full px-2 py-0.5 border ${s.active ? "text-green-700" : "text-slate-500"}`}>
                            {s.active ? "Activo" : "Inactivo"}
                          </span>
                          {s.destacado && (
                            <span className="text-xs rounded-full px-2 py-0.5 border border-amber-300 bg-amber-50 text-amber-800">
                              Destacado
                            </span>
                          )}
                        </div>
                        {s.description && <p className="text-sm text-slate-600 mt-1">{s.description}</p>}
                        {s.price_clp > 0 && (
                            <p className="text-sm text-slate-700 mt-1">
                                {money.format(s.price_clp)}
                            </p>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-lg border px-3 py-2"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                        <textarea
                          className="w-full rounded-lg border px-3 py-2"
                          rows={3}
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                        />
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <input
                            type="number"
                            min={0}
                            className="w-full sm:w-48 rounded-lg border px-3 py-2"
                            value={editPrice}
                            onChange={(e) => setEditPrice(Number(e.target.value))}
                          />
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={editActive}
                              onChange={(e) => setEditActive(e.target.checked)}
                            />
                            Activo
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            className="w-full rounded-lg border px-3 py-2"
                            onChange={(e) => setEditImageFile(e.target.files?.[0] ?? null)}
                          />

                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!editing ? (
                      <>
                        <button
                          disabled={busyId === s.id}
                          onClick={() => toggleActive(s)}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                          {s.active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          disabled={busyId === s.id}
                          onClick={() => toggleDestacado(s)}
                          className={`rounded-lg border px-3 py-2 text-sm disabled:opacity-50 ${s.destacado ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100" : "hover:bg-slate-50"}`}
                          title="Aparece en la sección Servicios Destacados del inicio (máx. 3)"
                        >
                          {s.destacado ? "Quitar destacado" : "Destacar"}
                        </button>
                        <button
                          disabled={busyId === s.id}
                          onClick={() => startEdit(s)}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                          Editar
                        </button>
                        <button
                          disabled={busyId === s.id}
                          onClick={() => remove(s.id)}
                          className="rounded-lg border px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          Eliminar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          disabled={busyId === s.id}
                          onClick={() => saveEdit(s.id)}
                          className="rounded-lg bg-black px-3 py-2 text-sm text-white font-medium disabled:opacity-50"
                        >
                          {busyId === s.id ? "Guardando..." : "Guardar"}
                        </button>
                        <button
                          disabled={busyId === s.id}
                          onClick={cancelEdit}
                          className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
