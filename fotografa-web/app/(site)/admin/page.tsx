"use client";

import { useEffect, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminHelpBox } from "FotosMony/components/ui/AdminHelpBox";

type Metrics = {
  totalRevenue: number;
  paidOrders: number;
  pendingOrders: number;
  totalOrders: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchMetrics = async (accessToken: string) => {
    const res = await fetch("/api/admin/metrics", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (res.ok) return data as Metrics;
    throw new Error(data?.error ?? "Error");
  };

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      setLoading(true);
      setErrorMsg(null);

      // 1) sesión
      const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        setErrorMsg(sessionErr.message);
        setLoading(false);
        return;
      }

      const session = sessionRes.session;
      if (!session?.user) {
        router.push("/login");
        return;
      }

      if (!mounted) return;
      setEmail(session.user.email ?? null);

      // 2) verificar admin
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileErr) {
        setErrorMsg(profileErr.message);
        setLoading(false);
        return;
      }

      const isAdmin = profile?.role === "admin";
      if (!isAdmin) {
        router.push("/");
        return;
      }

      // 3) pedir métricas al backend (seguro)
      const accessToken = session.access_token;

      try {
        const data = await fetchMetrics(accessToken);
        if (mounted) setMetrics(data);
      } catch (e) {
        if (mounted) setErrorMsg(e instanceof Error ? e.message : "No se pudieron cargar métricas");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">Panel Admin</h1>
        <p className="mt-2 text-slate-600">Cargando...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">Panel Admin</h1>
        <div className="mt-4 rounded-xl border bg-white p-4">
          <p className="text-sm font-semibold text-red-600">Error</p>
          <p className="mt-1 text-sm text-slate-700">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">Panel Admin</h1>
        <p className="text-sm text-slate-600">
          Bienvenido{email ? `, ${email}` : ""}.
        </p>
      </div>

      <div className="mt-6">
        <AdminHelpBox
          title="¿Cómo funciona el Panel Admin?"
          items={[
            "Este es tu centro de control. Desde aquí puedes ver tus ventas y acceder a todas las secciones.",
            "Las tarjetas de arriba muestran cuánto has vendido y el estado de tus pedidos.",
            "Usa los botones de abajo para ir a cada sección: subir fotos, crear eventos, etc.",
          ]}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard title="Ganancias (pagadas)" value={formatCLP(metrics?.totalRevenue ?? 0)} />
        <StatCard title="Órdenes pagadas" value={String(metrics?.paidOrders ?? 0)} />
        <StatCard title="Órdenes pendientes" value={String(metrics?.pendingOrders ?? 0)} />
        <StatCard title="Órdenes totales" value={String(metrics?.totalOrders ?? 0)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <AdminLinkCard
          title="Eventos y Subeventos"
          desc="Crea y administra eventos y subeventos."
          href="/admin/eventos"
        />
        <AdminLinkCard
          title="Subir Fotos"
          desc="Sube fotos a Cloudinary y asigna precios."
          href="/admin/fotos"
        />
        <AdminLinkCard
          title="Servicios y Precios"
          desc="Edita servicios ofrecidos y sus precios."
          href="/admin/servicios"
        />
        <AdminLinkCard
          title="Portafolio"
          desc="Actualiza el portafolio público."
          href="/admin/portafolio"
        />
        <AdminLinkCard
          title="Clientes"
          desc="Lista de clientes y actividad."
          href="/admin/clientes"
        />
        <AdminLinkCard
          title="Mensajes de contacto"
          desc="Mensajes enviados desde el formulario de contacto."
          href="/admin/mensajes"
        />
        <AdminLinkCard
          title="Configuración"
          desc="Marca de agua y ajustes del sitio."
          href="/admin/configuracion"
        />
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function AdminLinkCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border bg-white p-4 transition hover:bg-slate-50 block"
    >
      <p className="text-base font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <p className="mt-3 text-sm font-semibold text-slate-900">Ir →</p>
    </Link>
  );
}


function formatCLP(n: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(n);
}
