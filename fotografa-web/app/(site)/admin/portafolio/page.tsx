"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "FotosMony/lib/supabaseClient";
import { AdminHelpBox } from "FotosMony/components/ui/AdminHelpBox";

type Carpeta = { id: string; nombre: string; descripcion?: string | null };
type Foto = { id: string; public_id: string; storage_provider?: string | null };

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");
function fotoUrl(foto: Foto, w = 200): string {
  if (foto.storage_provider === "cloudflare" && R2_BASE) {
    return `${R2_BASE}/${foto.public_id}`;
  }
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w}/${foto.public_id}`;
}

export default function AdminPortafolioPage() {
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [createNombre, setCreateNombre] = useState("");
  const [createDescripcion, setCreateDescripcion] = useState("");
  const [createFiles, setCreateFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editCarpetaId, setEditCarpetaId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editFotos, setEditFotos] = useState<Foto[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const fetchCarpetas = async () => {
    setErrorMsg(null);
    setLoading(true);
    const token = await getToken();
    if (!token) {
      setErrorMsg("Inicia sesión para ver el portafolio.");
      setCarpetas([]);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/carpetas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setCarpetas(data.carpetas ?? []);
      } else {
        setErrorMsg(data?.error ?? "No se pudieron cargar las carpetas.");
        setCarpetas([]);
      }
    } catch {
      setErrorMsg("Error de conexión.");
      setCarpetas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarpetas();
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !creating) setModalOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [modalOpen, creating]);

  useEffect(() => {
    if (!editModalOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !savingEdit && !uploadingPhoto) setEditModalOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [editModalOpen, savingEdit, uploadingPhoto]);

  const openEditModal = async (carpetaId: string) => {
    const token = await getToken();
    if (!token) return;
    setEditError(null);
    setEditCarpetaId(carpetaId);
    setEditLoading(true);
    setEditModalOpen(true);
    try {
      const res = await fetch(`/api/admin/carpetas/${carpetaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setEditNombre(data.carpeta.nombre ?? "");
        setEditDescripcion(data.carpeta.descripcion ?? "");
        setEditFotos(data.fotos ?? []);
      } else {
        setEditError(data?.error ?? "No se pudo cargar la carpeta.");
      }
    } catch {
      setEditError("Error de conexión.");
    } finally {
      setEditLoading(false);
    }
  };

  const closeEditModal = () => {
    if (!savingEdit && !uploadingPhoto) {
      setEditModalOpen(false);
      setEditCarpetaId(null);
      setEditNombre("");
      setEditDescripcion("");
      setEditFotos([]);
      setEditError(null);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCarpetaId) return;
    const token = await getToken();
    if (!token) return;
    setEditError(null);
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/carpetas/${editCarpetaId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: editNombre.trim(),
          descripcion: editDescripcion.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCarpetas((prev) =>
          prev.map((c) =>
            c.id === editCarpetaId
              ? { ...c, nombre: data.carpeta.nombre, descripcion: data.carpeta.descripcion }
              : c
          )
        );
      } else {
        setEditError(data?.error ?? "No se pudo guardar.");
      }
    } catch {
      setEditError("Error de conexión.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeletePhoto = async (fotoId: string) => {
    if (!confirm("¿Eliminar esta foto de la carpeta?")) return;
    const token = await getToken();
    if (!token) return;
    setDeletingPhotoId(fotoId);
    try {
      const res = await fetch(`/api/admin/fotos/${fotoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setEditFotos((prev) => prev.filter((f) => f.id !== fotoId));
      } else {
        const data = await res.json();
        alert(data?.error ?? "No se pudo eliminar la foto.");
      }
    } catch {
      alert("Error de conexión.");
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editCarpetaId) return;
    const token = await getToken();
    if (!token) return;
    setEditError(null);
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const res = await fetch(`/api/admin/carpetas/${editCarpetaId}/fotos`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setEditFotos((prev) => [...prev, data.foto]);
      } else {
        setEditError(data?.error ?? "No se pudo subir la foto.");
      }
    } catch {
      setEditError("Error de conexión.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta carpeta y sus fotos?")) return;
    const token = await getToken();
    if (!token) {
      alert("Sesión no encontrada");
      return;
    }
    const res = await fetch(`/api/admin/carpetas/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCarpetas((prev) => prev.filter((c) => c.id !== id));
    } else {
      const data = await res.json();
      alert(data?.error ?? "Hubo un error al eliminar la carpeta");
    }
  };

  const openCreateModal = () => {
    setCreateNombre("");
    setCreateDescripcion("");
    setCreateFiles([]);
    setCreateError(null);
    setModalOpen(true);
  };

  const closeCreateModal = () => {
    if (!creating) setModalOpen(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files ? Array.from(e.target.files) : [];
    setCreateFiles(list);
  };

  const handleCreateCarpeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    const nombre = createNombre.trim();
    if (!nombre) {
      setCreateError("El nombre de la carpeta es obligatorio.");
      return;
    }
    if (createFiles.length === 0) {
      setCreateError("Sube al menos una foto.");
      return;
    }

    const token = await getToken();
    if (!token) {
      setCreateError("Sesión no encontrada.");
      return;
    }

    setCreating(true);
    const formData = new FormData();
    formData.set("nombre", nombre);
    if (createDescripcion.trim()) formData.set("descripcion", createDescripcion.trim());
    createFiles.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("/api/admin/carpetas", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        setCarpetas((prev) => [data.carpeta, ...prev]);
        closeCreateModal();
      } else {
        setCreateError(data?.error ?? "No se pudo crear la carpeta.");
      }
    } catch {
      setCreateError("Error de conexión.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Portafolio</h1>
          <p className="mt-1 text-sm text-slate-600">
            Carpetas del portafolio público. Crear, ver y eliminar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Volver al panel
          </Link>
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Crear carpeta
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {errorMsg}
          <button
            type="button"
            onClick={() => fetchCarpetas()}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="mt-6">
        <AdminHelpBox
          title="¿Cómo funciona el portafolio?"
          items={[
            "El portafolio es tu galería pública para mostrar tus mejores trabajos (no son fotos de venta).",
            "Crea carpetas para organizar tu trabajo (ej: 'Bodas', 'Retratos', 'Paisajes').",
            "Cada carpeta puede tener muchas fotos. Estas fotos NO tienen marca de agua y son solo para mostrar.",
            "Los visitantes pueden ver tu portafolio para conocer tu estilo antes de contratarte.",
            "Puedes editar el nombre y descripción de cada carpeta, y agregar o quitar fotos.",
            "La primera foto de cada carpeta se usa como portada en la lista de carpetas.",
          ]}
        />
      </div>

      {loading ? (
        <p className="mt-6 text-slate-600">Cargando...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {carpetas.length === 0 && !errorMsg ? (
            <div className="px-6 py-12 text-center text-slate-600">
              No hay carpetas. Crea una con el botón &quot;Crear carpeta&quot;.
            </div>
          ) : (
            <table className="w-full min-w-[400px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {carpetas.map((carpeta) => (
                  <tr
                    key={carpeta.id}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{carpeta.nombre}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600">
                      {carpeta.descripcion || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(carpeta.id)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(carpeta.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal Crear carpeta */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeCreateModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              Crear carpeta
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Nombre de la carpeta y fotos. Se subirán a Cloudflare R2.
            </p>

            <form onSubmit={handleCreateCarpeta} className="mt-6 space-y-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-slate-700">
                  Nombre de la carpeta *
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={createNombre}
                  onChange={(e) => setCreateNombre(e.target.value)}
                  placeholder="Ej: Bodas 2025"
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                  disabled={creating}
                />
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-slate-700">
                  Descripción (opcional)
                </label>
                <textarea
                  id="descripcion"
                  value={createDescripcion}
                  onChange={(e) => setCreateDescripcion(e.target.value)}
                  placeholder="Breve descripción de la carpeta"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  disabled={creating}
                />
              </div>

              <div>
                <label htmlFor="files" className="block text-sm font-medium text-slate-700">
                  Fotos *
                </label>
                <input
                  id="files"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={onFileChange}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                  disabled={creating}
                />
                {createFiles.length > 0 && (
                  <p className="mt-1 text-xs text-slate-500">
                    {createFiles.length} foto(s) seleccionada(s)
                  </p>
                )}
              </div>

              {createError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {creating ? "Creando carpeta..." : "Crear carpeta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar carpeta */}
      {editModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeEditModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-modal-title" className="text-lg font-semibold text-slate-900">
              Editar carpeta
            </h2>

            {editLoading ? (
              <p className="mt-4 text-slate-600">Cargando...</p>
            ) : (
              <>
                <form onSubmit={handleSaveEdit} className="mt-6 space-y-4">
                  <div>
                    <label htmlFor="edit-nombre" className="block text-sm font-medium text-slate-700">
                      Nombre
                    </label>
                    <input
                      id="edit-nombre"
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      disabled={savingEdit}
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-descripcion" className="block text-sm font-medium text-slate-700">
                      Descripción
                    </label>
                    <textarea
                      id="edit-descripcion"
                      value={editDescripcion}
                      onChange={(e) => setEditDescripcion(e.target.value)}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      disabled={savingEdit}
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                    >
                      {savingEdit ? "Guardando..." : "Guardar cambios"}
                    </button>
                  </div>
                </form>

                <div className="mt-8 border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-semibold text-slate-900">Fotos de la carpeta</h3>
                    <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                      {uploadingPhoto ? "Subiendo..." : "Subir nueva foto"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploadingPhoto}
                        onChange={handleUploadPhoto}
                      />
                    </label>
                  </div>

                  {editError && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                      {editError}
                    </div>
                  )}

                  {editFotos.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No hay fotos en esta carpeta.</p>
                  ) : (
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                      {editFotos.map((foto) => (
                        <div
                          key={foto.id}
                          className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                        >
                          <img
                            src={fotoUrl(foto, 300)}
                            alt=""
                            className="aspect-square w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(foto.id)}
                            disabled={deletingPhotoId === foto.id}
                            className="absolute right-2 top-2 rounded-lg bg-red-600 px-2 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-50"
                          >
                            {deletingPhotoId === foto.id ? "..." : "Eliminar"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={savingEdit || uploadingPhoto}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
