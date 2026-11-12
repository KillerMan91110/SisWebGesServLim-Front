import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleHome } from "../utils/roleHome";

const PASOS = [
  {
    numero: "1",
    titulo: "Publica tu necesidad",
    texto: "Indica el tipo de atención que necesitas, una breve descripción y tu ubicación.",
  },
  {
    numero: "2",
    titulo: "Un médico verificado la acepta",
    texto: "Los profesionales disponibles cerca de ti ven tu solicitud en el mapa y la aceptan.",
  },
  {
    numero: "3",
    titulo: "Seguimiento en tiempo real",
    texto: "Ves en el mapa cómo llega y coordinas los detalles por chat hasta finalizar la atención.",
  },
];

const SERVICIOS = [
  { icon: "💉", titulo: "Vía intravenosa / catéter", texto: "Colocación y control de vías por personal capacitado." },
  { icon: "💊", titulo: "Inyecciones", texto: "Aplicación de medicamentos indicados por tu médico." },
  { icon: "🩹", titulo: "Curación de heridas", texto: "Limpieza, curación y cambio de apósitos en casa." },
  { icon: "❤️", titulo: "Signos vitales", texto: "Presión arterial, glucosa, temperatura y saturación." },
];

const FAMILIA = [
  { img: "/NinoPaciente.png", label: "Niños", pos: "75% 30%" },
  { img: "/JovenPaciente.png", label: "Jóvenes", pos: "center 25%" },
  { img: "/Paciente.png", label: "Adultos mayores", pos: "center 20%" },
  { img: "/EmbarazadPaciente.png", label: "Gestantes", pos: "center top" },
];

const PILARES = [
  {
    icon: "🪪",
    titulo: "Médicos con CMP verificado",
    texto: "El personal administrativo valida la colegiatura de cada médico antes de activar su cuenta.",
  },
  {
    icon: "🔒",
    titulo: "Datos clínicos protegidos",
    texto: "Contraseñas cifradas y acceso por rol: solo tú, tu médico y la administración ven tu solicitud.",
  },
  {
    icon: "📊",
    titulo: "Gestión con indicadores",
    texto: "La administración monitorea solicitudes, tiempos de atención y reportes para decidir mejor.",
  },
];

const TEASERS = [
  {
    to: "/nosotros",
    icon: "🩺",
    titulo: "Quiénes somos",
    texto: "Conoce el propósito de MedGo y el centro médico que lo impulsa.",
  },
  {
    to: "/personal",
    icon: "👩‍⚕️",
    titulo: "Nuestro personal",
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
      <section id="inicio" className="hero-band">
        <div className="hero">
          <div className="hero-copy">
            <span className="eyebrow">✚ Centro médico · Puente Piedra</span>
            <h1>
              Atención médica a domicilio, <span className="text-primary">rápida y segura</span>
            </h1>
            <p>
              Publica lo que necesitas y un profesional de salud verificado y
              cercano te atenderá en tu domicilio o en su consultorio.
            </p>
            <div className="landing-actions">
              <Link to="/register">Solicitar atención</Link>
              <Link to="/login" className="secondary">
                Ya tengo cuenta
              </Link>
            </div>
            <ul className="hero-trust">
              <li>✔ Médicos con CMP validado</li>
              <li>✔ Seguimiento en el mapa</li>
              <li>✔ Chat directo con tu médico</li>
            </ul>
          </div>
          <div className="hero-image">
            <img src="/Paciente.png" alt="Profesional de salud atendiendo a un paciente en casa" />
            <div className="hero-floating-card">
              <span className="hero-floating-icon">🩺</span>
              <div>
                <strong>Médico en camino</strong>
                <small>Sigue su llegada en tiempo real</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="eyebrow">Proceso</span>
            <h2>¿Cómo funciona?</h2>
            <p>Sin citas fijas ni largas esperas: atención cuando la necesitas.</p>
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
            <span className="eyebrow">Servicios</span>
            <h2>Procedimientos que puedes solicitar</h2>
            <p>Atenciones frecuentes que nuestros profesionales realizan a domicilio.</p>
          </div>
          <div className="service-grid">
            {SERVICIOS.map((s) => (
              <div key={s.titulo} className="service-card">
                <span className="service-card-icon" aria-hidden="true">
                  {s.icon}
                </span>
                <h3>{s.titulo}</h3>
                <p>{s.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="eyebrow">Pacientes</span>
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

      <section className="landing-section landing-section--muted">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="eyebrow">Confianza</span>
            <h2>¿Por qué elegir MedGo?</h2>
          </div>
          <div className="pillar-grid">
            {PILARES.map((p) => (
              <div key={p.titulo} className="pillar-card">
                <span className="pillar-card-icon" aria-hidden="true">
                  {p.icon}
                </span>
                <div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                </div>
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

      <section className="landing-section landing-section--tight">
        <div className="landing-cta">
          <h2>¿Necesitas atención ahora?</h2>
          <p>
            Crea tu cuenta en segundos y publica tu solicitud. Un médico
            verificado cercano podrá aceptarla de inmediato.
          </p>
          <Link to="/paciente" className="landing-cta-button">
            Solicitar atención
          </Link>
          <p className="landing-cta-note">
            Si es una emergencia que pone en riesgo la vida, llama al 106 (SAMU) o
            acude al hospital más cercano.
          </p>
        </div>
      </section>
    </div>
  );
}
