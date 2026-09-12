import { useEffect, useMemo, useState } from "react";
import { getPublicDoctors } from "../services/medicoService";

function getInitials(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0]?.toUpperCase())
    .join("");
}

export function StaffPage() {
  const [medicos, setMedicos] = useState([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [especialidad, setEspecialidad] = useState("");

  useEffect(() => {
    getPublicDoctors()
      .then(setMedicos)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const especialidades = useMemo(
    () => [...new Set(medicos.map((m) => m.especialidad))].sort(),
    [medicos]
  );

  const visibles = especialidad
    ? medicos.filter((m) => m.especialidad === especialidad)
    : medicos;

  return (
    <div className="landing">
      <div className="page-header">
        <h1>Nuestro personal</h1>
        <p>Médicos y profesionales de salud verificados en la plataforma.</p>
      </div>

      <section className="landing-section">
        <div className="landing-section-inner">
          {error && (
            <p className="form-error" style={{ textAlign: "center" }}>
              No se pudo cargar el listado de médicos.
            </p>
          )}
          {loading && <p style={{ textAlign: "center" }}>Cargando...</p>}

          {!loading && !error && medicos.length === 0 && (
            <p style={{ textAlign: "center" }}>
              Pronto se sumarán más profesionales verificados a la plataforma.
            </p>
          )}

          {!loading && especialidades.length > 1 && (
            <div className="staff-toolbar">
              <select
                value={especialidad}
                onChange={(e) => setEspecialidad(e.target.value)}
              >
                <option value="">Todas las especialidades</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>
                    {esp}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="staff-grid">
            {visibles.map((m) => (
              <div key={m.id} className="staff-card">
                <div className="staff-avatar">{getInitials(m.nombre)}</div>
                <h3>{m.nombre}</h3>
                <span className="staff-specialty">{m.especialidad}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
