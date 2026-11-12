import { useEffect, useState } from "react";
import { getMiHistorial, saveFicha } from "../services/pacienteService";
import { calcularEdad, formatFecha, formatFechaHora, MODALIDADES } from "../utils/formato";

const VACIA = {
  dni: "",
  fecha_nacimiento: "",
  sexo: "",
  grupo_sanguineo: "",
  alergias: "",
  antecedentes: "",
  medicacion_actual: "",
  contacto_emergencia_nombre: "",
  contacto_emergencia_telefono: "",
};

const GRUPOS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function aFormulario(ficha) {
  if (!ficha) return VACIA;
  return Object.fromEntries(Object.keys(VACIA).map((k) => [k, ficha[k] ?? ""]));
}

export function FichaClinicaPage() {
  const [form, setForm] = useState(VACIA);
  const [atenciones, setAtenciones] = useState([]);
  const [actualizado, setActualizado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMiHistorial()
      .then(({ ficha, atenciones }) => {
        setForm(aFormulario(ficha));
        setActualizado(ficha?.actualizado_en ?? null);
        setAtenciones(atenciones);
      })
      .catch(() => setError("No se pudo cargar tu ficha clínica."))
      .finally(() => setLoading(false));
  }, []);

  function campo(nombre) {
    return {
      value: form[nombre],
      onChange: (e) => setForm((prev) => ({ ...prev, [nombre]: e.target.value })),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMensaje(null);
    try {
      const ficha = await saveFicha(form);
      setForm(aFormulario(ficha));
      setActualizado(ficha.actualizado_en);
      setMensaje("Ficha clínica guardada correctamente.");
    } catch (err) {
      const detalle = err.response?.data?.detalles?.[0]?.mensaje;
      setError(detalle ?? err.response?.data?.error ?? "No se pudo guardar la ficha.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="page-loading">Cargando ficha clínica...</p>;

  const edad = calcularEdad(form.fecha_nacimiento);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Mi ficha clínica</h1>
          <p>
            Esta información solo la ven el médico que acepta tu atención y la administración.
            Mantenerla al día ayuda a que te atiendan de forma segura.
          </p>
        </div>
        {actualizado && (
          <span className="form-hint">Última actualización: {formatFechaHora(actualizado)}</span>
        )}
      </div>

      <section className="panel">
        <h2>Datos personales y clínicos</h2>
        {error && <p className="form-error" role="alert">{error}</p>}
        {mensaje && <p className="form-success" role="status">✔ {mensaje}</p>}
        <form className="request-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              DNI
              <input inputMode="numeric" maxLength={12} placeholder="12345678" {...campo("dni")} />
            </label>
            <label>
              Fecha de nacimiento {edad !== null && <span className="form-hint">({edad} años)</span>}
              <input type="date" {...campo("fecha_nacimiento")} />
            </label>
            <label>
              Sexo
              <select {...campo("sexo")}>
                <option value="">Sin especificar</option>
                <option value="femenino">Femenino</option>
                <option value="masculino">Masculino</option>
                <option value="otro">Otro</option>
              </select>
            </label>
            <label>
              Grupo sanguíneo
              <select {...campo("grupo_sanguineo")}>
                <option value="">No sé / sin especificar</option>
                {GRUPOS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            ⚠️ Alergias
            <textarea placeholder="Ej.: penicilina, mariscos. Escribe «Ninguna» si no tienes." {...campo("alergias")} />
          </label>
          <label>
            Antecedentes / enfermedades previas
            <textarea placeholder="Ej.: hipertensión, diabetes, operaciones previas" {...campo("antecedentes")} />
          </label>
          <label>
            Medicación actual
            <textarea placeholder="Ej.: losartán 50 mg cada 24 h" {...campo("medicacion_actual")} />
          </label>

          <h3 className="form-section-title">Contacto de emergencia</h3>
          <div className="form-grid">
            <label>
              Nombre
              <input maxLength={150} {...campo("contacto_emergencia_nombre")} />
            </label>
            <label>
              Teléfono
              <input inputMode="tel" maxLength={20} {...campo("contacto_emergencia_telefono")} />
            </label>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar ficha clínica"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Mi historial de atenciones</h2>
        {atenciones.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🩺</span>
            <p>Aún no tienes atenciones finalizadas.</p>
          </div>
        )}
        <ol className="timeline">
          {atenciones.map((a) => (
            <li key={a.id} className="timeline-item">
              <div className="timeline-head">
                <strong>{a.tipo_procedimiento}</strong>
                <span className="form-hint">{formatFecha(a.finalizado_en)}</span>
              </div>
              <div className="form-hint">
                {MODALIDADES[a.modalidad]?.icon} {MODALIDADES[a.modalidad]?.label} · {a.medico_nombre}
                {a.medico_especialidad ? ` (${a.medico_especialidad})` : ""}
              </div>
              {a.diagnostico && (
                <p>
                  <b>Diagnóstico:</b> {a.diagnostico}
                </p>
              )}
              {a.recomendaciones && (
                <p>
                  <b>Recomendaciones:</b> {a.recomendaciones}
                </p>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
