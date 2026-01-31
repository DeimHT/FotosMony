"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useCart } from "FotosMony/components/context/CartContext";
import { supabase } from "FotosMony/lib/supabaseClient";

type SearchResult = {
  eventos: { id: string; nombre: string; slug: string; url: string; type: string }[];
  subeventos: { id: string; nombre: string; slug: string; eventSlug: string; url: string; type: string }[];
  servicios: { id: string; title: string; url: string; type: string }[];
  portafolio: { id: string; nombre: string; url: string; type: string }[];
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Portafolio", href: "/portafolio" },
  { label: "Eventos", href: "/eventos" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { totalCount: cartCount } = useCart();

  const [email, setEmail] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (res.ok) setSearchResults(data);
      else setSearchResults(null);
    } catch {
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery, fetchSearch]);

  useEffect(() => {
    const onBlur = (e: FocusEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.relatedTarget as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("focusin", onBlur);
    return () => document.removeEventListener("focusin", onBlur);
  }, []);

  const totalResults =
    searchResults &&
    searchQuery.length >= 2
      ? searchResults.eventos.length +
        searchResults.subeventos.length +
        searchResults.servicios.length +
        searchResults.portafolio.length
      : 0;
  const showDropdown = searchOpen && searchQuery.length >= 2;

  const goToSearchPage = () => {
    const q = searchQuery.trim();
    if (q.length >= 2) {
      setSearchOpen(false);
      router.push(`/buscar?q=${encodeURIComponent(q)}`);
    }
  };


  // Sesión: cargar al inicio + escuchar cambios
  useEffect(() => {
    let mounted = true;

    const loadSessionAndRole = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setEmail(null);
        setNombre(null);
        setIsAdmin(false);
        setLoadingAuth(false);
        return;
      }

      setEmail(session.user.email ?? null);
      setNombre(session.user.user_metadata.full_name ?? null);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();


      const admin = profile?.role === "admin";
      setIsAdmin(admin);

      setLoadingAuth(false);
    };

    loadSessionAndRole();


    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        setEmail(null);
        setNombre(null);
        setIsAdmin(false);
        setLoadingAuth(false);
        return;
      }

      setEmail(session.user.email ?? null);

      supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          setIsAdmin(data?.role === "admin");
          setLoadingAuth(false);
        });
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
  };

  const activeHref = useMemo(() => {
    const match = navItems.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
    );
    return match?.href ?? "";
  }, [pathname]);

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Left: logo + brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M9 7l1.2-2h3.6L15 7h2a3 3 0 013 3v8a3 3 0 01-3 3H7a3 3 0 01-3-3v-8a3 3 0 013-3h2z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
              <path
                d="M12 18a4 4 0 100-8 4 4 0 000 8z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>

          <span className="text-lg font-semibold text-slate-900">FotosMony</span>
        </Link>

        {/* Center: buscador (desktop) + nav */}
        <div className="hidden flex-1 items-center justify-center gap-6 md:flex">
        <div ref={searchRef} className="relative w-full max-w-xs">
          <label htmlFor="header-search" className="sr-only">
            Buscar eventos, servicios o portafolio
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="Buscar eventos, servicios, portafolio…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setSearchOpen(false);
              if (e.key === "Enter") {
                e.preventDefault();
                goToSearchPage();
              }
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-4 pr-11 text-sm text-slate-900 placeholder:text-slate-500 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={goToSearchPage}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Ir a resultados de búsqueda"
          >
            {searchLoading ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            )}
          </button>
          {showDropdown && (
            <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
              {totalResults === 0 && !searchLoading ? (
                <p className="px-4 py-3 text-sm text-slate-500">Sin resultados para &quot;{searchQuery}&quot;</p>
              ) : (
                <>
                  {searchResults!.eventos.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-500">Eventos</p>
                      {searchResults!.eventos.map((e) => (
                        <Link
                          key={e.id}
                          href={e.url}
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-900 hover:bg-slate-100"
                        >
                          {e.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.subeventos.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-500">Subeventos</p>
                      {searchResults!.subeventos.map((s) => (
                        <Link
                          key={s.id}
                          href={s.url}
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-900 hover:bg-slate-100"
                        >
                          {s.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.servicios.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-500">Servicios</p>
                      {searchResults!.servicios.map((s) => (
                        <Link
                          key={s.id}
                          href={s.url}
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-900 hover:bg-slate-100"
                        >
                          {s.title}
                        </Link>
                      ))}
                    </div>
                  )}
                  {searchResults!.portafolio.length > 0 && (
                    <div className="px-2 pb-1">
                      <p className="px-2 py-1 text-xs font-semibold uppercase text-slate-500">Portafolio</p>
                      {searchResults!.portafolio.map((p) => (
                        <Link
                          key={p.id}
                          href={p.url}
                          onClick={() => setSearchOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-slate-900 hover:bg-slate-100"
                        >
                          {p.nombre}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = activeHref === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        </div>

        {/* Right: Carrito + Auth + mobile toggle */}
        <div className="flex items-center gap-2">
          <Link
            href="/carrito"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border text-slate-700 hover:bg-slate-50"
            aria-label={`Carrito: ${cartCount} foto(s)`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 7h15l-2 8H8L6 7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
              <path d="M6 7 5 4H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M9 20a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z" stroke="currentColor" strokeWidth="2" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-xs font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          {/* Desktop auth area */}
          <div className="hidden items-center gap-2 md:flex">
            {loadingAuth ? null : email ? (
              <>
                <span className="text-sm text-slate-700">
                  Bienvenido <span className="font-semibold">{nombre}</span>
                </span>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Panel Admin
                  </Link>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border text-slate-900 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
            aria-expanded={open}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t bg-white md:hidden">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="relative mb-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <label htmlFor="mobile-search" className="sr-only">Buscar</label>
                  <input
                    id="mobile-search"
                    type="search"
                    placeholder="Buscar eventos, servicios, portafolio…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        goToSearchPage();
                        setOpen(false);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-4 text-sm text-slate-900 placeholder:text-slate-500"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    goToSearchPage();
                    setOpen(false);
                  }}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  aria-label="Ir a resultados de búsqueda"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                </button>
              </div>
              {showDropdown && searchQuery.length >= 2 && (
                <div className="absolute left-4 right-4 z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg md:hidden">
                  {totalResults === 0 && !searchLoading ? (
                    <p className="px-4 py-3 text-sm text-slate-500">Sin resultados</p>
                  ) : (
                    <>
                      {searchResults?.eventos.map((e) => (
                        <Link key={e.id} href={e.url} onClick={() => { setSearchOpen(false); setOpen(false); }} className="block px-4 py-2 text-sm text-slate-900 hover:bg-slate-100">
                          Evento: {e.nombre}
                        </Link>
                      ))}
                      {searchResults?.subeventos.map((s) => (
                        <Link key={s.id} href={s.url} onClick={() => { setSearchOpen(false); setOpen(false); }} className="block px-4 py-2 text-sm text-slate-900 hover:bg-slate-100">
                          Subevento: {s.nombre}
                        </Link>
                      ))}
                      {searchResults?.servicios.map((s) => (
                        <Link key={s.id} href={s.url} onClick={() => { setSearchOpen(false); setOpen(false); }} className="block px-4 py-2 text-sm text-slate-900 hover:bg-slate-100">
                          Servicio: {s.title}
                        </Link>
                      ))}
                      {searchResults?.portafolio.map((p) => (
                        <Link key={p.id} href={p.url} onClick={() => { setSearchOpen(false); setOpen(false); }} className="block px-4 py-2 text-sm text-slate-900 hover:bg-slate-100">
                          Portafolio: {p.nombre}
                        </Link>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = activeHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium",
                      isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/carrito"
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2",
                  pathname === "/carrito" ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:bg-slate-50"
                )}
              >
                Carrito {cartCount > 0 && `(${cartCount})`}
              </Link>

              {/* Mobile auth area */}
              <div className="mt-2 flex flex-col gap-2">
                {loadingAuth ? null : email ? (
                  <>
                    <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      Bienvenido <span className="font-semibold">{nombre}</span>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Panel Admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl border px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Iniciar sesión
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                    >
                      Registrarse
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
