import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <h4 className="site-footer-brand">
            <span className="navbar-logo-badge" aria-hidden="true">✚</span> MedGo
          </h4>
          <p>
            Conectamos pacientes con profesionales de salud verificados para
            atención médica a domicilio, cuando y donde se necesita.
          </p>
          <p className="site-footer-emergency">🚑 Emergencias: 106 (SAMU)</p>
        </div>
        <div>
          <h4>Navegación</h4>
          <ul className="site-footer-links">
            <li>
              <Link to="/">Inicio</Link>
            </li>
            <li>
              <Link to="/nosotros">Quiénes somos</Link>
            </li>
            <li>
              <Link to="/personal">Personal</Link>
            </li>
            <li>
              <Link to="/contacto">Contáctanos</Link>
            </li>
          </ul>
        </div>
        <div>
          <h4>Contacto</h4>
          <p>contacto@medgo.pe</p>
          <p>(01) 000-0000</p>
          <p>Puente Piedra, Lima</p>
          <p>Lun – Dom · 7:00 a. m. – 10:00 p. m.</p>
        </div>
      </div>
      <div className="site-footer-bottom">
        © {new Date().getFullYear()} MedGo.
      </div>
    </footer>
  );
}
