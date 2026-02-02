"use client";

import { useState } from "react";
import { supabase } from "FotosMony/lib/supabaseClient";
import { useRouter } from "next/navigation";

function loginErrorMessage(msg: string): string {
  if (msg.includes("Invalid login credentials")) {
    return "Correo o contraseña incorrectos. Verifica e intenta de nuevo.";
  }
  return msg;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(loginErrorMessage(error.message));
    } else {
      router.push("/");
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
    const baseUrl =
      appUrl && appUrl.startsWith("http")
        ? appUrl
        : typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
    const redirectTo = `${baseUrl}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) setErrorMessage(loginErrorMessage(error.message));
  };


  return (
    <div className="flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        
        <h1 className="text-2xl font-semibold text-center mb-6">
          Iniciar sesión
        </h1>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full border border-gray-300 bg-white py-2 rounded-lg font-medium hover:bg-gray-50 transition"
        >
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 my-4">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">o</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>


        <form onSubmit={handleLogin} className="space-y-4">
          {errorMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {errorMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="ejemplo@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
              required
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Acceso exclusivo para clientes
        </p>
      </div>
    </div>
  );
}
