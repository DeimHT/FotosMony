export default function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="container footer__grid">
        <div>
          <div className="footer__brand">
            <span className="brand__icon" aria-hidden>📷</span>
            <span className="brand__name">FotosMony</span>
          </div>
          <p className="muted">
            Especialistas en servicios fotográficos profesionales en la región de los lagos.
            Capturamos tus momentos más preciados con la más alta calidad y dedicación.
          </p>

          <div className="footer__social">
            <a href="#" aria-label="Instagram">📷</a>
            <a href="#" aria-label="Facebook">👍</a>
          </div>
        </div>

        <div>
          <h4>Contacto</h4>
          <ul className="list">
            <li>📍 Región de Los Lagos, Chile</li>
            <li>📞 +56 9 1234 5678</li>
            <li>✉️ info@fotosmony.cl</li>
          </ul>
        </div>

        <div>
          <h4>Servicios</h4>
          <ul className="list">
            <li>Sesiones Fotográficas</li>
            <li>Impresión de Fotos</li>
            <li>Fotos Digitales</li>
            <li>Eventos Especiales</li>
          </ul>
        </div>
      </div>
      <div className="container footer__bottom">
        © {new Date().getFullYear()} FotosMony. Todos los derechos reservados. Región de Los Lagos, Chile.
      </div>
    </footer>
  )
}
