import { useState } from 'react'

type Testimonial = {
  quote: string
  name: string
  locationService: string
}

const DATA: Testimonial[] = [
  {
    quote:
      'La calidad de impresión es increíble. Mandé a imprimir fotos de mi viaje por la región y quedaron mejor de lo que esperaba. El papel es de primera calidad.',
    name: 'Carlos Mendoza',
    locationService: 'Frutillar • Impresión Fotográfica',
  },
  {
    quote:
      'La sesión fotográfica en los paisajes del lago fue hermosa. Me guiaron con mucha paciencia y las fotos quedaron soñadas.',
    name: 'Ana Rodríguez',
    locationService: 'Puerto Montt • Sesión Fotográfica',
  },
  {
    quote:
      'Compré varias fotos digitales para mis redes sociales. La resolución y el color son perfectos, 100% recomendado.',
    name: 'Daniela Paredes',
    locationService: 'Puerto Varas • Fotos Digitales',
  },
]

export default function Testimonials() {
  const [i, setI] = useState(0)
  const t = DATA[i]
  const to = (dir: -1 | 1) => setI((prev) => (prev + dir + DATA.length) % DATA.length)

  return (
    <section className="section" aria-labelledby="testi-title">
      <div className="container">
        <h2 className="section__title" id="testi-title">Lo Que Dicen Nuestros Clientes</h2>
        <p className="section__subtitle">
          La satisfacción de nuestros clientes es nuestra mayor recompensa
        </p>

        <div className="testi">
          <button className="testi__arrow" aria-label="Anterior" onClick={() => to(-1)}>‹</button>

          <figure className="testi__card">
            <div className="testi__quoteIcon" aria-hidden>❝❞</div>
            <blockquote>{t.quote}</blockquote>
            <div className="testi__stars" aria-hidden>★★★★★</div>
            <figcaption>
              <strong>{t.name}</strong>
              <div className="muted">{t.locationService}</div>
            </figcaption>
          </figure>

          <button className="testi__arrow" aria-label="Siguiente" onClick={() => to(1)}>›</button>
        </div>

        <div className="testi__dots" role="tablist" aria-label="Cambiar testimonio">
          {DATA.map((_, idx) => (
            <button
              key={idx}
              className={`dot ${idx === i ? 'is-active' : ''}`}
              aria-label={`Testimonio ${idx + 1}`}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
