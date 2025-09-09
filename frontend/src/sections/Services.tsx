function Card({
  title,
  icon,
  bullets,
}: {
  title: string
  icon: string
  bullets: string[]
}) {
  return (
    <article className="card">
      <div className="card__icon" aria-hidden>{icon}</div>
      <h3 className="card__title">{title}</h3>
      <ul className="card__list">
        {bullets.map((b, i) => (
          <li key={i}>↗ {b}</li>
        ))}
      </ul>
      <a className="btn btn--primary card__cta" href="#servicios">Más Información</a>
    </article>
  )
}

export default function Services() {
  return (
    <section className="section" id="servicios" aria-labelledby="servicios-title">
      <div className="container">
        <h2 className="section__title" id="servicios-title">Nuestros Servicios Profesionales</h2>
        <p className="section__subtitle">
          Ofrecemos una gama completa de servicios fotográficos para capturar y preservar tus
          momentos más especiales en la región de los lagos
        </p>

        <div className="grid3">
          <Card
            title="Impresión de Fotografías"
            icon="🖨️"
            bullets={[
              'Papel fotográfico premium',
              'Múltiples tamaños disponibles',
              'Acabados mate y brillante',
              'Entrega rápida',
            ]}
          />
          <Card
            title="Venta de Fotos Digitales"
            icon="⬇️"
            bullets={[
              'Alta resolución',
              'Descarga inmediata',
              'Múltiples formatos',
              'Licencia de uso personal',
            ]}
          />
          <Card
            title="Sesiones Fotográficas"
            icon="📷"
            bullets={[
              'Fotógrafos profesionales',
              'Locaciones únicas',
              'Edición incluida',
              'Entrega digital',
            ]}
          />
        </div>
      </div>
    </section>
  )
}
