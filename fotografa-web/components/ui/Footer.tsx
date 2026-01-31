import Link from "next/link";
import { FaInstagram, FaFacebookF } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="mt-24 bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Marca */}
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900">
                    {/* icono simple tipo cámara */}
                    <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    >
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
                <span className="text-lg font-semibold text-slate-400">
                    FotosMony
                </span>
            </div>

            <p className="mt-4 max-w-sm text-sm text-slate-400">
              Tu estudio de fotografía de confianza en la región de los lagos.
              Capturamos momentos únicos con la calidad profesional que mereces.
            </p>

            {/* Redes */}
            <div className="mt-6 flex gap-3">
                <a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                    aria-label="Instagram"
                >
                    <FaInstagram className="h-5 w-5 text-white" />
                </a>

                <a
                    href="#"
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                    aria-label="Facebook"
                >
                    <FaFacebookF className="h-5 w-5 text-white" />
                </a>
            </div>
          </div>

          {/* Servicios */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Servicios
            </h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/servicios" className="hover:text-white transition">
                  Sesiones Fotográficas
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition">
                  Impresión de Fotos
                </Link>
              </li>
              <li>
                <Link href="/servicios" className="hover:text-white transition">
                  Fotos Digitales
                </Link>
              </li>
              <li>
                <Link href="/eventos" className="hover:text-white transition">
                  Eventos Especiales
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white">
              Contacto
            </h4>
            <ul className="space-y-4 text-sm text-slate-400">
              <li className="flex items-center gap-3">
                📞 <span>+56 9 XXXX XXXX</span>
              </li>
              <li className="flex items-center gap-3">
                ✉️ <span>info@fotosmony.cl</span>
              </li>
              <li className="flex items-center gap-3">
                📍 <span>Región de los Lagos, Chile</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Línea */}
        <div className="my-10 h-px w-full bg-slate-800" />

        {/* Copyright */}
        <p className="text-center text-sm text-slate-500">
          © 2025 FotosMony. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
