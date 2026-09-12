const CANALES = [
  { icon: "✉️", titulo: "Correo", texto: "contacto@medgo.pe" },
  { icon: "📞", titulo: "Teléfono", texto: "(01) 000-0000" },
  { icon: "📍", titulo: "Ubicación", texto: "Lima, Perú" },
];

export function ContactPage() {
  return (
    <div className="landing">
      <div className="page-header">
        <h1>Contáctanos</h1>
        <p>[Borrador — reemplazar con los datos reales de contacto]</p>
      </div>

      <section className="landing-section">
        <div className="landing-section-inner">
          <div className="contact-grid">
            {CANALES.map((c) => (
              <div key={c.titulo} className="contact-card">
                <span className="contact-card-icon">{c.icon}</span>
                <h3>{c.titulo}</h3>
                <p>{c.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
