const SECCIONES = [
  {
    titulo: "1. Responsable del tratamiento",
    texto: [
      "MedGo, plataforma web del centro médico ubicado en el distrito de Puente Piedra, Lima, es responsable del banco de datos personales de sus usuarios (pacientes, médicos y personal administrativo).",
    ],
  },
  {
    titulo: "2. Datos que recopilamos",
    lista: [
      "Datos de identificación y contacto: nombre, correo, teléfono y DNI.",
      "Datos de salud (datos sensibles): alergias, antecedentes, medicación, diagnósticos y reportes de atención.",
      "Ubicación aproximada al publicar una solicitud o, en el caso de los médicos, mientras están en línea o en camino.",
      "Datos profesionales de los médicos: número de colegiatura (CMP) y especialidad.",
      "Mensajes del chat de cada atención y calificaciones del servicio.",
    ],
  },
  {
    titulo: "3. Para qué los usamos",
    lista: [
      "Coordinar la atención médica a domicilio o en consultorio y el seguimiento en tiempo real.",
      "Permitir que el médico asignado conozca tu información clínica antes de atenderte.",
      "Verificar la habilitación de los profesionales de salud.",
      "Generar indicadores y reportes anónimos o agregados para mejorar la gestión del servicio.",
    ],
  },
  {
    titulo: "4. Quién puede ver tu información",
    texto: [
      "Tu ficha e historial clínico solo los ve el médico asignado a tu solicitud y el personal administrativo autorizado. Cada consulta al historial clínico y cada supervisión del chat queda registrada en un registro de auditoría. No vendemos ni cedemos tus datos a terceros.",
    ],
  },
  {
    titulo: "5. Cómo los protegemos",
    lista: [
      "Contraseñas cifradas y acceso restringido según el rol de cada usuario.",
      "Registro de auditoría de los accesos a información clínica.",
      "Copias de seguridad automáticas de la base de datos.",
      "Límite de intentos de inicio de sesión para prevenir accesos no autorizados.",
    ],
  },
  {
    titulo: "6. Conservación",
    texto: [
      "Conservamos tus datos mientras mantengas una cuenta activa y durante el tiempo que exija la normativa sanitaria aplicable a los registros de atención.",
    ],
  },
  {
    titulo: "7. Tus derechos (ARCO)",
    texto: [
      "Puedes solicitar el acceso, rectificación, cancelación u oposición al tratamiento de tus datos escribiendo a contacto@medgo.pe. Parte de tu información, como tu ficha clínica y tu perfil, puedes corregirla tú mismo desde la plataforma. También puedes acudir a la Autoridad Nacional de Protección de Datos Personales.",
    ],
  },
];

export function PrivacyPage() {
  return (
    <div className="landing">
      <div className="page-header">
        <span className="eyebrow">Legal</span>
        <h1>Política de privacidad</h1>
        <p>
          Tratamiento de datos personales y de salud conforme a la Ley N.° 29733, Ley de Protección
          de Datos Personales, y su reglamento.
        </p>
      </div>
      <section className="landing-section">
        <div className="landing-section-inner legal">
          {SECCIONES.map((s) => (
            <section key={s.titulo} className="legal-section">
              <h2>{s.titulo}</h2>
              {s.texto?.map((t) => (
                <p key={t}>{t}</p>
              ))}
              {s.lista && (
                <ul>
                  {s.lista.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="form-hint">Versión v1-2026 · Última actualización: noviembre de 2026.</p>
        </div>
      </section>
    </div>
  );
}
