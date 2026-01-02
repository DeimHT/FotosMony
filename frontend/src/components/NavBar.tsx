import { useState } from "react";
import { Camera } from "lucide-react";

export default function NavBar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        {/* Brand */}
        <a href="#inicio" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0B0B18] flex items-center justify-center">
            <Camera className="h-5 w-5 text-white" />
          </div>
          <span className="font-semibold text-xl text-[#0B0B18] leading-none">
            FotosMony
          </span>
        </a>

        {/* Toggle (solo mobile) */}
        <button
          className="md:hidden inline-flex items-center justify-center p-2 rounded-lg border"
          aria-label="Abrir menú"
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex md:items-center md:gap-10">
          <a className="text-[#0B0B18] hover:opacity-70" href="#inicio">Inicio</a>
          <a className="text-[#0B0B18] hover:opacity-70" href="#servicios">Servicios</a>
          <a className="text-[#0B0B18] hover:opacity-70" href="#galeria">Galería</a>
          <a className="text-[#0B0B18] hover:opacity-70" href="#nosotros">Nosotros</a>
          <a className="text-[#0B0B18] hover:opacity-70" href="#contacto">Contacto</a>

          <a
            href="#reserva"
            className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-[#0B0B18] text-white hover:opacity-90 transition"
          >
            Reservar Sesión
          </a>
        </nav>
      </div>

      {/* Mobile dropdown */}
      <div className={`${open ? "block" : "hidden"} md:hidden border-t bg-white`}>
        <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3">
          <a className="py-2" href="#inicio" onClick={() => setOpen(false)}>Inicio</a>
          <a className="py-2" href="#servicios" onClick={() => setOpen(false)}>Servicios</a>
          <a className="py-2" href="#galeria" onClick={() => setOpen(false)}>Galería</a>
          <a className="py-2" href="#nosotros" onClick={() => setOpen(false)}>Nosotros</a>
          <a className="py-2" href="#contacto" onClick={() => setOpen(false)}>Contacto</a>

          <a
            href="#reserva"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold bg-[#0B0B18] text-white"
          >
            Reservar Sesión
          </a>
        </nav>
      </div>
    </header>
  );
}
