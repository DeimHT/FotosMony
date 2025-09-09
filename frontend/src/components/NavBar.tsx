import { useState } from 'react'

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav">
      <div className="container nav__inner">
        <a href="#inicio" className="brand">
          <span className="brand__icon" aria-hidden>📷</span>
          <span className="brand__name">FotosMony</span>
        </a>

        <button
          className="nav__toggle"
          aria-label="Abrir menú"
          onClick={() => setOpen((o) => !o)}
        >
          ☰
        </button>

        <nav className={`nav__links ${open ? 'is-open' : ''}`}>
          <a href="#inicio">Inicio</a>
          <a href="#servicios">Servicios</a>
          <a href="#galeria">Galería</a>
          <a href="#contacto">Contacto</a>
          <a href="#reserva" className="btn btn--primary">Reservar Sesión</a>
        </nav>
      </div>
    </header>
  )
}
