"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";

type Cliente = {
  id: string;
  email: string;
  full_name: string;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
};

function formatDate(iso: string | null) {
  if (!iso) return "—";
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

export default function AdminClientesPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const searchLower = searchTerm.trim().toLowerCase();
  const clientesFiltrados = searchLower
    ? clientes.filter(
        (c) =>
          (c.full_name ?? "").toLowerCase().includes(searchLower) ||
          (c.email ?? "").toLowerCase().includes(searchLower)
      )
    : clientes;

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const fetchClientes = async () => {
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
      const res = await fetch("/api/admin/clientes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        setClientes(data.clientes ?? []);
      } else {
        setErrorMsg(data?.error ?? "No se pudieron cargar los clientes.");
        setClientes([]);
      }
    } catch {
      setErrorMsg("Error de conexión.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-600">
            Lista de usuarios registrados y su actividad.
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
            onClick={() => fetchClientes()}
            className="ml-2 font-semibold underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-slate-600">Cargando...</p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <label className="flex flex-1 min-w-[200px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-slate-400 focus-within:ring-offset-1">
              <span className="text-slate-500" aria-hidden>
                🔍
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o email"
                className="min-w-0 flex-1 border-0 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none"
                aria-label="Buscar por nombre o email"
              />
            </label>
            {searchTerm.trim() && (
              <span className="text-sm text-slate-500">
                {clientesFiltrados.length} de {clientes.length} resultado(s)
              </span>
            )}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {clientes.length === 0 && !errorMsg ? (
              <div className="px-6 py-12 text-center text-slate-600">
                No hay clientes registrados.
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-600">
                No hay resultados para &quot;{searchTerm.trim()}&quot;.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Nombre
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Rol
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Registro
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Último acceso
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-900">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{c.full_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            c.role === "admin"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {c.role === "admin" ? "Admin" : "Cliente"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(c.created_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatDate(c.last_sign_in_at)}
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
