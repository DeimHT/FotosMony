"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";
import type { HeroContent, AboutContent } from "FotosMony/lib/homeContent";

const R2_BASE = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/$/, "");

function heroImageUrl(hero: HeroContent): string {
  if (hero.image_url) return hero.image_url;
  if (hero.image_public_id && R2_BASE) return `${R2_BASE}/${hero.image_public_id}`;
  return "https://images.unsplash.com/photo-1718147155878-e2baab858e74?w=400&h=500&fit=crop&q=80";
}

function aboutImageUrl(about: AboutContent): string {
  if (about.image_url) return about.image_url;
  if (about.image_public_id && R2_BASE) return `${R2_BASE}/${about.image_public_id}`;
  return "https://images.unsplash.com/photo-1493724798364-c4ca5e3f5fd3?w=400&h=300&fit=crop&q=80";
}

export default function AdminInicioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [about, setAbout] = useState<AboutContent | null>(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingAbout, setUploadingAbout] = useState(false);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setLoading(false);
      return;
    }
    const res = await fetch("/api/admin/home", { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo cargar el contenido");
      setLoading(false);
      return;
    }
    setHero(data.hero ?? null);
    setAbout(data.about ?? null);
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
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
      if (profile?.role !== "admin") {
        router.push("/");
        return;
      }
      await load();
    };
    boot();
    return () => {
      mounted = false;
    };
  }, [router, load]);

  const save = async () => {
    if (!hero || !about) return;
    setSaving(true);
    setErrorMsg(null);
    const token = await getToken();
    if (!token) {
      setErrorMsg("Sesión no encontrada");
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/home", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ hero, about }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data?.error ?? "No se pudo guardar");
      setSaving(false);
      return;
    }
    setSaving(false);
  };

  const uploadImage = async (section: "hero" | "about", file: File, oldPublicId: string | null) => {
    const token = await getToken();
    if (!token) return;
    const form = new FormData();
    form.append("file", file);
    form.append("section", section);
    if (oldPublicId) form.append("old_public_id", oldPublicId);
    const res = await fetch("/api/admin/home/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Error subiendo imagen");
    return data as { image_url: string; image_public_id: string };
  };

  if (loading || !hero || !about) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-xl font-semibold text-slate-900">Editar inicio</h1>
        <p className="mt-2 text-slate-600">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Panel
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">Editar contenido del inicio</h1>
      </div>

      {errorMsg && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{errorMsg}</p>
        </div>
      )}

      {/* Hero */}
      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sección principal (Hero)</h2>
        <p className="mt-1 text-sm text-slate-600">
          Título, texto y botones de la parte superior de la página de inicio.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Título (puedes usar varias líneas)</span>
              <textarea
                value={hero.title}
                onChange={(e) => setHero({ ...hero, title: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Subtítulo</span>
              <textarea
                value={hero.subtitle}
                onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Texto botón principal</span>
              <input
                type="text"
                value={hero.cta_primary_text}
                onChange={(e) => setHero({ ...hero, cta_primary_text: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Texto botón secundario</span>
              <input
                type="text"
                value={hero.cta_secondary_text}
                onChange={(e) => setHero({ ...hero, cta_secondary_text: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Badge: título</span>
              <input
                type="text"
                value={hero.badge_title}
                onChange={(e) => setHero({ ...hero, badge_title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Badge: subtítulo</span>
              <input
                type="text"
                value={hero.badge_subtitle}
                onChange={(e) => setHero({ ...hero, badge_subtitle: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
          </div>
          <div>
            <span className="text-sm font-medium text-slate-700">Imagen principal</span>
            <div className="mt-2 flex flex-col gap-2">
              <img
                src={heroImageUrl(hero)}
                alt="Vista previa hero"
                className="h-48 w-full rounded-xl object-cover"
              />
              <input
                type="file"
                accept="image/*"
                className="text-sm text-slate-600"
                disabled={uploadingHero}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingHero(true);
                  try {
                    const result = await uploadImage(
                      "hero",
                      file,
                      hero.image_public_id
                    );
                    if (result) setHero({ ...hero, image_url: result.image_url, image_public_id: result.image_public_id });
                  } catch (err) {
                    setErrorMsg(err instanceof Error ? err.message : "Error subiendo imagen");
                  } finally {
                    setUploadingHero(false);
                    e.target.value = "";
                  }
                }}
              />
              {uploadingHero && <p className="text-xs text-slate-500">Subiendo...</p>}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mt-8 rounded-2xl border bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Sobre FotosMony</h2>
        <p className="mt-1 text-sm text-slate-600">
          Imagen, card flotante, texto y estadísticas de la sección &quot;Sobre nosotros&quot;.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-slate-700">Imagen</span>
            <div className="mt-2 flex flex-col gap-2">
              <img
                src={aboutImageUrl(about)}
                alt="Vista previa sobre nosotros"
                className="h-48 w-full rounded-xl object-cover"
              />
              <input
                type="file"
                accept="image/*"
                className="text-sm text-slate-600"
                disabled={uploadingAbout}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadingAbout(true);
                  try {
                    const result = await uploadImage(
                      "about",
                      file,
                      about.image_public_id
                    );
                    if (result) setAbout({ ...about, image_url: result.image_url, image_public_id: result.image_public_id });
                  } catch (err) {
                    setErrorMsg(err instanceof Error ? err.message : "Error subiendo imagen");
                  } finally {
                    setUploadingAbout(false);
                    e.target.value = "";
                  }
                }}
              />
              {uploadingAbout && <p className="text-xs text-slate-500">Subiendo...</p>}
            </div>
            <label className="mt-4 block">
              <span className="text-sm font-medium text-slate-700">Título del card flotante</span>
              <input
                type="text"
                value={about.card_title}
                onChange={(e) => setAbout({ ...about, card_title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="mt-2 block">
              <span className="text-sm font-medium text-slate-700">Texto del card</span>
              <textarea
                value={about.card_text}
                onChange={(e) => setAbout({ ...about, card_text: e.target.value })}
                rows={2}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
          </div>
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Título de sección</span>
              <input
                type="text"
                value={about.section_title}
                onChange={(e) => setAbout({ ...about, section_title: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Párrafo intro</span>
              <textarea
                value={about.intro}
                onChange={(e) => setAbout({ ...about, intro: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </label>
            <div>
              <span className="text-sm font-medium text-slate-700">Viñetas (título + descripción)</span>
              <div className="mt-2 space-y-3">
                {about.bullets.map((b, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-3">
                    <input
                      type="text"
                      placeholder="Título"
                      value={b.title}
                      onChange={(e) => {
                        const next = [...about.bullets];
                        next[i] = { ...next[i], title: e.target.value };
                        setAbout({ ...about, bullets: next });
                      }}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Descripción"
                      value={b.description}
                      onChange={(e) => {
                        const next = [...about.bullets];
                        next[i] = { ...next[i], description: e.target.value };
                        setAbout({ ...about, bullets: next });
                      }}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-slate-700">Estadísticas (valor + etiqueta)</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {about.stats.map((s, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 p-2">
                    <input
                      type="text"
                      placeholder="Valor"
                      value={s.value}
                      onChange={(e) => {
                        const next = [...about.stats];
                        next[i] = { ...next[i], value: e.target.value };
                        setAbout({ ...about, stats: next });
                      }}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Etiqueta"
                      value={s.label}
                      onChange={(e) => {
                        const next = [...about.stats];
                        next[i] = { ...next[i], label: e.target.value };
                        setAbout({ ...about, stats: next });
                      }}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
