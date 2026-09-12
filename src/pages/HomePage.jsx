import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/roleHome";

const PASOS = [
  {
    numero: "1",
    titulo: "Publica tu necesidad",
    texto: "Cuéntanos qué tipo de atención necesitas y dónde te encuentras.",
  },
  {
    numero: "2",
    titulo: "Un profesional cercano la acepta",
    texto: "Los médicos verificados que están cerca ven tu solicitud y la aceptan.",
  },
  {
    numero: "3",
    titulo: "Te atiende en tu domicilio",
    texto: "Sigues en el mapa su llegada y coordinas todo por chat en tiempo real.",
  },
];

const FAMILIA = [
  { img: "/NinoPaciente.png", label: "Niños", pos: "75% 30%" },
  { img: "/JovenPaciente.png", label: "Jóvenes", pos: "center 25%" },
  { img: "/Paciente.png", label: "Adultos mayores", pos: "center 20%" },
  { img: "/EmbarazadPaciente.png", label: "Gestantes", pos: "center top" },
];

const TEASERS = [
  {
    to: "/nosotros",
    icon: "🩺",
    titulo: "Quiénes somos",
    texto: "Conoce el propósito detrás de MedGo y por qué lo creamos.",
  },
  {
    to: "/personal",
    icon: "👩‍⚕️",
    titulo: "Personal",
    texto: "Médicos y profesionales de salud verificados en la plataforma.",
  },
  {
    to: "/contacto",
    icon: "✉️",
    titulo: "Contáctanos",
    texto: "¿Tienes dudas? Escríbenos, con gusto te ayudamos.",
  },
];

export function HomePage() {
  const { user } = useAuth();

  if (user) return <Navigate to={roleHome(user.rol)} replace />;

  return (
    <div className="landing">
      <section id="inicio" className="hero">
        <div className="hero-copy">
          <h1>Atención médica a domicilio, al instante</h1>
          <p>
            Publica lo que necesitas y un profesional de salud verificado y
            cercano te atenderá en tu domicilio.
          </p>
          <div className="landing-actions">
            <Link to="/register">Crear cuenta</Link>
            <Link to="/login" className="secondary">
              Ingresar
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/Paciente.png" alt="Profesional de salud atendiendo a un paciente en casa" />
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="section-header">
            <h2>¿Cómo funciona?</h2>
            <p>Sin citas fijas ni esperas: atención cuando la necesitas.</p>
          </div>
          <div className="landing-steps">
            {PASOS.map((paso) => (
              <div key={paso.titulo} className="landing-step">
                <span className="landing-step-badge">{paso.numero}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted">
        <div className="landing-section-inner">
          <div className="section-header">
            <h2>Cuidamos de toda tu familia</h2>
            <p>Desde los más pequeños hasta los más grandes de la casa.</p>
          </div>
          <div className="family-grid">
            {FAMILIA.map((f) => (
              <div key={f.label} className="family-card">
                <div className="family-card-image">
                  <img src={f.img} alt={f.label} style={{ objectPosition: f.pos }} />
                </div>
                <div className="family-card-label">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="teaser-grid">
            {TEASERS.map((t) => (
              <Link key={t.to} to={t.to} className="teaser-card">
                <span className="teaser-card-icon">{t.icon}</span>
                <h3>{t.titulo}</h3>
                <p>{t.texto}</p>
                <span className="teaser-card-link">Conocer más →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-cta">
          <h2>¿Necesitas atención ahora?</h2>
          <p>
            Inicia sesión para solicitar atención médica a domicilio. Si no
            tienes cuenta, puedes crear una en segundos.
          </p>
          <Link to="/paciente" className="landing-cta-button">
            Solicitar atención
          </Link>
        </div>
      </section>
    </div>
  );
}
