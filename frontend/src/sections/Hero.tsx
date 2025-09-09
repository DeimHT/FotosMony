export default function Hero() {
  return (
    <section className="hero" id="inicio" aria-label="Portada">
      <div className="hero__bg" role="img" aria-label="Lago y bosque de la región de Los Lagos" />
      <div className="hero__overlay" />
      <div className="container hero__content">
        <div className="hero__icon" aria-hidden>📸 💛</div>
        <h1 className="hero__title">
          Capturamos los Momentos<br />Más Preciados de la<br />Región de los Lagos
        </h1>
        <p className="hero__subtitle">
          Servicios profesionales de fotografía, impresión de alta calidad y venta
          de fotos digitales en el corazón de la región de los lagos
        </p>

        <div className="hero__actions">
          <a href="#reserva" className="btn btn--primary">Reservar Sesión Fotográfica</a>
          <a href="#galeria" className="btn btn--ghost">Ver Nuestro Trabajo</a>
        </div>
      </div>
    </section>
  )
}
