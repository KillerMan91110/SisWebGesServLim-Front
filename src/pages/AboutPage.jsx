const VALORES = [
  {
    icon: "🎯",
    titulo: "Acceso oportuno",
    texto: "Reducir el tiempo entre necesitar atención y recibirla.",
  },
  {
    icon: "✅",
    titulo: "Confianza verificada",
    texto: "Cada profesional pasa por una validación de su colegiatura antes de atender.",
  },
  {
    icon: "🔒",
    titulo: "Seguridad de la información",
    texto: "Los datos médicos de cada solicitud solo son visibles para las partes involucradas.",
  },
];

export function AboutPage() {
  return (
    <div className="landing">
      <div className="page-header">
        <h1>Quiénes somos</h1>
        <p>Un proyecto pensado para acercar la atención médica a quien la necesita.</p>
      </div>

      <section className="landing-section">
        <div className="landing-section-inner hero" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="hero-copy">
            <p>
              [Borrador — reemplazar con el texto real] En Lima Metropolitana,
              acceder a atención médica rápida y de calidad sigue siendo un
              reto para muchas familias: procesos manuales, largas esperas y
              poca información en tiempo real dificultan la gestión de los
              servicios médicos.
            </p>
            <p>
              MedGo nace como un proyecto de investigación e implementación
              tecnológica que busca conectar directamente a pacientes con
              profesionales de salud verificados, acercando la atención al
              lugar donde se necesita y aportando datos concretos sobre cómo
              la tecnología puede mejorar la gestión de servicios médicos.
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
            <h2>Lo que nos guía</h2>
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
    </div>
  );
}
