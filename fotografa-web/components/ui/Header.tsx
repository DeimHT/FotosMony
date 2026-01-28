"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const navItems = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "/servicios" },
  { label: "Portafolio", href: "/portfolio" },
  { label: "Eventos", href: "/eventos" },
  { label: "Contacto", href: "/contacto" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);


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

        {/* Center: nav (desktop) */}
        <nav className="hidden items-center gap-8 md:flex">
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

        {/* Right: Auth buttons + mobile toggle */}
        <div className="flex items-center gap-2">
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
