const VALORES = [
  {
    icon: "⏱️",
    titulo: "Eficiencia administrativa",
    texto: "Procesos ágiles y ordenados: menos papeleo y registros manuales, más tiempo para atender.",
  },
  {
    icon: "🤝",
    titulo: "Calidad de atención",
    texto: "Atención oportuna, información disponible y pacientes satisfechos con el servicio recibido.",
  },
  {
    icon: "📊",
    titulo: "Decisiones con datos",
    texto: "Indicadores y reportes actualizados para que la dirección decida con información real.",
  },
];

const COMPROMISOS = [
  {
    icon: "🪪",
    titulo: "Profesionales verificados",
    texto: "Cada médico registra su número de colegiatura (CMP) y el personal administrativo lo valida antes de habilitarlo.",
  },
  {
    icon: "🔒",
    titulo: "Seguridad de la información",
    texto: "Contraseñas cifradas, acceso según rol y datos clínicos visibles solo para las partes involucradas.",
  },
  {
    icon: "🧭",
    titulo: "Fácil de usar",
    texto: "Una interfaz clara y accesible desde el celular o la computadora, pensada para todas las edades.",
  },
];

export function AboutPage() {
  return (
    <div className="landing">
      <div className="page-header">
        <span className="eyebrow">Nosotros</span>
        <h1>Quiénes somos</h1>
        <p>Una plataforma web para acercar la atención médica a quien la necesita.</p>
      </div>

      <section className="landing-section">
        <div className="landing-section-inner about-intro">
          <div className="about-copy">
            <h2>Nuestra historia</h2>
            <p>
              En Puente Piedra, como en gran parte de Lima Norte, acceder a una
              atención médica rápida sigue siendo un reto para muchas familias:
              registros manuales, demoras para coordinar la atención y poca
              información en tiempo real dificultan la gestión de los servicios
              médicos.
            </p>
            <p>
              MedGo nace en un centro médico del distrito como una plataforma web
              que conecta directamente a los pacientes con médicos verificados.
              El paciente publica su solicitud; los médicos disponibles cerca la
              aceptan y la atienden en el domicilio o en su consultorio, mientras
              el personal administrativo supervisa todo el proceso.
            </p>
          </div>
          <div className="hero-image">
            <img src="/JovenPaciente.png" alt="Profesional de salud atendiendo a una paciente" />
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--muted">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="eyebrow">Propósito</span>
            <h2>Lo que buscamos mejorar</h2>
            <p>Tres objetivos guían la gestión de nuestros servicios médicos.</p>
          </div>
          <div className="landing-steps">
            {VALORES.map((v) => (
              <div key={v.titulo} className="landing-step">
                <span className="teaser-card-icon">{v.icon}</span>
                <h3>{v.titulo}</h3>
                <p>{v.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="section-header">
            <span className="eyebrow">Compromisos</span>
            <h2>Cómo cuidamos de ti</h2>
          </div>
          <div className="pillar-grid">
            {COMPROMISOS.map((c) => (
              <div key={c.titulo} className="pillar-card">
                <span className="pillar-card-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <div>
                  <h3>{c.titulo}</h3>
                  <p>{c.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
