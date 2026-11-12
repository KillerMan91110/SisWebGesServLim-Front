const CANALES = [
  { icon: "✉️", titulo: "Correo", texto: "contacto@medgo.pe" },
  { icon: "📞", titulo: "Teléfono", texto: "(01) 000-0000" },
  { icon: "📍", titulo: "Ubicación", texto: "Puente Piedra, Lima Metropolitana" },
  { icon: "🕒", titulo: "Horario", texto: "Lunes a domingo · 7:00 a. m. – 10:00 p. m." },
];

export function ContactPage() {
  return (
    <div className="landing">
      <div className="page-header">
        <span className="eyebrow">Contacto</span>
        <h1>Contáctanos</h1>
        <p>Resolvemos tus dudas sobre la plataforma, tu cuenta o una atención.</p>
      </div>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="contact-grid">
            {CANALES.map((c) => (
              <div key={c.titulo} className="contact-card">
                <span className="contact-card-icon" aria-hidden="true">
                  {c.icon}
                </span>
                <h3>{c.titulo}</h3>
                <p>{c.texto}</p>
              </div>
            ))}
          </div>

          <div className="emergency-banner" role="note">
            <span className="emergency-banner-icon" aria-hidden="true">
              🚑
            </span>
            <div>
              <strong>¿Es una emergencia?</strong>
              <p>
                MedGo no reemplaza a un servicio de emergencias. Si la vida de
                alguien está en riesgo, llama al <b>106 (SAMU)</b> o acude al
                hospital más cercano.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
