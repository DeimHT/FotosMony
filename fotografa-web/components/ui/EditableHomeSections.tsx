"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "FotosMony/lib/supabaseClient";
import type { HeroContent, AboutContent } from "FotosMony/lib/homeContent";

type Props = {
  initialHero: HeroContent;
  initialAbout: AboutContent;
  heroImgSrc: string;
  aboutImgSrc: string;
  r2PublicUrl: string;
};

export function EditableHomeSections({
  initialHero,
  initialAbout,
  heroImgSrc: initialHeroImgSrc,
  aboutImgSrc: initialAboutImgSrc,
  r2PublicUrl,
}: Props) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState<"hero" | "about" | null>(null);
  const [hero, setHero] = useState<HeroContent>(initialHero);
  const [about, setAbout] = useState<AboutContent>(initialAbout);
  const [heroImgSrc, setHeroImgSrc] = useState(initialHeroImgSrc);
  const [aboutImgSrc, setAboutImgSrc] = useState(initialAboutImgSrc);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"hero" | "about" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const checkAdmin = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch("/api/admin/home", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setIsAdmin(true);
  }, [getToken]);

  useEffect(() => {
    let mounted = true;
    checkAdmin();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted && session) checkAdmin();
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [checkAdmin]);

  const save = useCallback(
    async (section: "hero" | "about") => {
      setSaving(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError("Sesión no encontrada");
        setSaving(false);
        return;
      }
      const body = section === "hero" ? { hero: hero } : { about: about };
      const res = await fetch("/api/admin/home", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "No se pudo guardar");
        setSaving(false);
        return;
      }
      setEditing(null);
      setSaving(false);
    },
    [getToken, hero, about]
  );

  const uploadImage = useCallback(
    async (section: "hero" | "about", file: File) => {
      const token = await getToken();
      if (!token) return;
      setUploading(section);
      setError(null);
      const form = new FormData();
      form.append("file", file);
      form.append("section", section);
      if (section === "hero" && hero.image_public_id) form.append("old_public_id", hero.image_public_id);
      if (section === "about" && about.image_public_id) form.append("old_public_id", about.image_public_id);
      const res = await fetch("/api/admin/home/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Error subiendo imagen");
        setUploading(null);
        return;
      }
      const url = json.image_url ?? (r2PublicUrl ? `${r2PublicUrl}/${json.image_public_id}` : "");
      if (section === "hero") {
        setHero((h) => ({ ...h, image_url: url, image_public_id: json.image_public_id }));
        setHeroImgSrc(url);
      } else {
        setAbout((a) => ({ ...a, image_url: url, image_public_id: json.image_public_id }));
        setAboutImgSrc(url);
      }
      setUploading(null);
    },
    [getToken, r2PublicUrl, hero.image_public_id, about.image_public_id]
  );

  const EditButton = useCallback(
    ({ section }: { section: "hero" | "about" }) => {
      if (!isAdmin) return null;
      return (
        <button
          type="button"
          onClick={() => setEditing(section)}
          className="absolute bottom-2 right-2 z-[100] rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-lg ring-2 ring-white hover:bg-slate-800"
        >
          Editar
        </button>
      );
    },
    [isAdmin]
  );

  return (
    <>
      {/* HERO */}
      <section className="relative mx-auto max-w-7xl px-4 py-16">
        <EditButton section="hero" />
        {editing !== "hero" ? (
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
                {hero.title.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < hero.title.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </h1>
              <p className="mt-6 max-w-xl text-base text-slate-600">{hero.subtitle}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/servicios"
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {hero.cta_primary_text}
                </Link>
                <Link
                  href="/contacto"
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
                >
                  {hero.cta_secondary_text}
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <Image
                  src={heroImgSrc}
                  alt="Paisaje Región de los Lagos, Chile — sesión fotográfica"
                  width={900}
                  height={1100}
                  className="h-full w-full object-cover"
                  priority
                  loading="eager"
                />
              </div>
              {hero.badge_visible !== false && (
                <div className="absolute -bottom-6 left-6 rounded-2xl bg-white px-5 py-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">📷</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{hero.badge_title}</p>
                      <p className="text-xs text-slate-600">{hero.badge_subtitle}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
            <p className="mb-4 text-sm font-semibold text-slate-700">Editar sección principal</p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-600">Título</label>
                <textarea
                  value={hero.title}
                  onChange={(e) => setHero((h) => ({ ...h, title: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="block text-xs font-medium text-slate-600">Subtítulo</label>
                <textarea
                  value={hero.subtitle}
                  onChange={(e) => setHero((h) => ({ ...h, subtitle: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="block text-xs font-medium text-slate-600">Botón principal</label>
                <input
                  value={hero.cta_primary_text}
                  onChange={(e) => setHero((h) => ({ ...h, cta_primary_text: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="block text-xs font-medium text-slate-600">Botón secundario</label>
                <input
                  value={hero.cta_secondary_text}
                  onChange={(e) => setHero((h) => ({ ...h, cta_secondary_text: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hero.badge_visible !== false}
                    onChange={(e) => setHero((h) => ({ ...h, badge_visible: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">Mostrar badge en la imagen</span>
                </label>
                <label className="block text-xs font-medium text-slate-600">Badge: título</label>
                <input
                  value={hero.badge_title}
                  onChange={(e) => setHero((h) => ({ ...h, badge_title: e.target.value }))}
                  placeholder="Título"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="block text-xs font-medium text-slate-600">Badge: subtítulo</label>
                <input
                  value={hero.badge_subtitle}
                  onChange={(e) => setHero((h) => ({ ...h, badge_subtitle: e.target.value }))}
                  placeholder="Subtítulo"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600">Imagen</label>
                <img src={heroImgSrc} alt="Vista previa" className="mt-2 h-48 w-full rounded-xl object-cover" />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 text-sm text-slate-600"
                  disabled={uploading === "hero"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage("hero", f);
                    e.target.value = "";
                  }}
                />
                {uploading === "hero" && <p className="text-xs text-slate-500">Subiendo…</p>}
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => save("hero")}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="relative mx-auto max-w-7xl px-4 py-20">
        <EditButton section="about" />
        {editing !== "about" ? (
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl shadow-xl">
                <img
                  src={aboutImgSrc}
                  alt="Paisajes Región de los Lagos, Chile"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {about.card_visible !== false && (
                <div className="absolute -bottom-6 left-6 max-w-xs rounded-2xl bg-white px-5 py-4 shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">📍</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{about.card_title}</p>
                      <p className="mt-1 text-xs text-slate-600">{about.card_text}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">{about.section_title}</h2>
              <p className="mt-4 text-slate-600">{about.intro}</p>
              <ul className="mt-6 space-y-4">
                {about.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-slate-900" />
                    <div>
                      <p className="font-semibold text-slate-900">{b.title}</p>
                      <p className="text-sm text-slate-600">{b.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {about.stats.map((s, i) => (
                  <div key={i}>
                    <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
                    <p className="text-sm text-slate-600">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
            <p className="mb-4 text-sm font-semibold text-slate-700">Editar Sobre FotosMony</p>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600">Imagen</label>
                <img src={aboutImgSrc} alt="Vista previa" className="mt-2 h-40 w-full rounded-xl object-cover" />
                <input
                  type="file"
                  accept="image/*"
                  className="mt-2 text-sm text-slate-600"
                  disabled={uploading === "about"}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) uploadImage("about", f);
                    e.target.value = "";
                  }}
                />
                {uploading === "about" && <p className="text-xs text-slate-500">Subiendo…</p>}
                <label className="mt-4 flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={about.card_visible !== false}
                    onChange={(e) => setAbout((a) => ({ ...a, card_visible: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">Mostrar card sobre la imagen</span>
                </label>
                <label className="mt-2 block text-xs font-medium text-slate-600">Card: título</label>
                <input
                  value={about.card_title}
                  onChange={(e) => setAbout((a) => ({ ...a, card_title: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="mt-2 block text-xs font-medium text-slate-600">Card: texto</label>
                <textarea
                  value={about.card_text}
                  onChange={(e) => setAbout((a) => ({ ...a, card_text: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-600">Título sección</label>
                <input
                  value={about.section_title}
                  onChange={(e) => setAbout((a) => ({ ...a, section_title: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <label className="block text-xs font-medium text-slate-600">Párrafo intro</label>
                <textarea
                  value={about.intro}
                  onChange={(e) => setAbout((a) => ({ ...a, intro: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
                <span className="block text-xs font-medium text-slate-600">Viñetas</span>
                {about.bullets.map((b, i) => (
                  <div key={i} className="rounded-lg border border-slate-200 bg-white p-2">
                    <input
                      value={b.title}
                      onChange={(e) => {
                        const next = [...about.bullets];
                        next[i] = { ...next[i], title: e.target.value };
                        setAbout((a) => ({ ...a, bullets: next }));
                      }}
                      placeholder="Título"
                      className="w-full rounded border px-2 py-1 text-sm"
                    />
                    <input
                      value={b.description}
                      onChange={(e) => {
                        const next = [...about.bullets];
                        next[i] = { ...next[i], description: e.target.value };
                        setAbout((a) => ({ ...a, bullets: next }));
                      }}
                      placeholder="Descripción"
                      className="mt-1 w-full rounded border px-2 py-1 text-sm"
                    />
                  </div>
                ))}
                <span className="block text-xs font-medium text-slate-600">Estadísticas</span>
                <div className="grid grid-cols-2 gap-2">
                  {about.stats.map((s, i) => (
                    <div key={i} className="rounded border border-slate-200 bg-white p-2">
                      <input
                        value={s.value}
                        onChange={(e) => {
                          const next = [...about.stats];
                          next[i] = { ...next[i], value: e.target.value };
                          setAbout((a) => ({ ...a, stats: next }));
                        }}
                        placeholder="Valor"
                        className="w-full rounded border px-2 py-1 text-sm"
                      />
                      <input
                        value={s.label}
                        onChange={(e) => {
                          const next = [...about.stats];
                          next[i] = { ...next[i], label: e.target.value };
                          setAbout((a) => ({ ...a, stats: next }));
                        }}
                        placeholder="Etiqueta"
                        className="mt-1 w-full rounded border px-2 py-1 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => save("about")}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
