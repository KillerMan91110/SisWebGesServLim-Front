import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MapView } from "../components/MapView";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import {
  cancelRequest,
  finishRequest,
  getMessages,
  getRequest,
  getHistorialClinico,
  getReport,
  rateRequest,
} from "../services/requestService";
import { calcularEdad, formatFecha, formatFechaHora, MODALIDADES } from "../utils/formato";
import { connectSocket } from "../services/socket";

function formatDistancia(metros) {
  if (metros === null || metros === undefined) return "calculando...";
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1)} km`;
}

export function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [doctorLocation, setDoctorLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);
  const [reportForm, setReportForm] = useState({
    diagnostico: "",
    procedimientoRealizado: "",
    observaciones: "",
    recomendaciones: "",
  });
  const [rating, setRating] = useState({ puntaje: 5, comentario: "" });
  const [distanciaMetros, setDistanciaMetros] = useState(null);
  const watchIdRef = useRef(null);
  const [historial, setHistorial] = useState(null);

  const esMedicoAsignado = user?.rol === "medico" && request?.medico_id === user?.id;
  useEffect(() => {
    if (!esMedicoAsignado && user?.rol !== "admin") return;
    getHistorialClinico(id)
      .then(setHistorial)
      .catch(() => setHistorial(null));
  }, [id, esMedicoAsignado, user?.rol]);

  useEffect(() => {
    getRequest(id)
      .then(setRequest)
      .catch(() => setError("No se pudo cargar la solicitud."));
    getMessages(id)
      .then(setMessages)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (request?.estado !== "finalizada") return;
    getReport(id)
      .then(setReport)
      .catch(() => {});
  }, [id, request?.estado]);

  useEffect(() => {
    const socket = connectSocket();
    socket.emit("solicitud:unirse", id, (ack) => {
      if (ack?.error) setError(ack.error);
    });

    socket.on("ubicacion:medico", (payload) => {
      if (String(payload.solicitudId) === String(id)) {
        setDoctorLocation({ lat: payload.lat, lng: payload.lng });
        setDistanciaMetros(payload.distanciaMetros);
      }
    });
    socket.on("mensaje:nuevo", (msg) => {
      if (String(msg.solicitud_id) === String(id)) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    // El evento trae la fila sin los datos unidos (nombres, consultorio):
    // se vuelve a pedir la solicitud completa para no perderlos.
    socket.on("solicitud:actualizada", (updated) => {
      if (String(updated.id) === String(id)) {
        getRequest(id).then(setRequest).catch(() => setRequest((prev) => ({ ...prev, ...updated })));
      }
    });

    return () => {
      socket.emit("solicitud:salir", id);
      socket.off("ubicacion:medico");
      socket.off("mensaje:nuevo");
      socket.off("solicitud:actualizada");
    };
  }, [id]);

  useEffect(() => {
    if (user?.rol !== "medico" || !navigator.geolocation) return;
    if (!["aceptada", "en_camino", "en_atencion"].includes(request?.estado)) return;
    // En consultorio el médico no se desplaza: no se transmite su ubicación.
    if (request?.modalidad === "consultorio") return;

    watchIdRef.current = navigator.geolocation.watchPosition((pos) => {
      const socket = connectSocket();
      socket.emit("ubicacion:enviar", {
        solicitudId: id,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [id, user, request?.estado, request?.modalidad]);

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const socket = connectSocket();
    socket.emit("mensaje:enviar", { solicitudId: id, contenido: draft }, (ack) => {
      if (ack?.error) setError(ack.error);
    });
    setDraft("");
  }

  async function handleCancel() {
    try {
      await cancelRequest(id);
      setRequest(await getRequest(id));
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo cancelar la solicitud.");
    }
  }

  async function handleFinish(e) {
    e.preventDefault();
    try {
      await finishRequest(id, reportForm);
      setRequest(await getRequest(id));
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo finalizar la solicitud.");
    }
  }

  async function handleRate(e) {
    e.preventDefault();
    try {
      await rateRequest(id, rating);
      const updated = await getRequest(id);
      setRequest(updated);
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo enviar la calificación.");
    }
  }

  if (error && !request) return <p className="form-error">{error}</p>;
  if (!request) return <p>Cargando...</p>;

  const pacienteUbicacion = { lat: request.lat, lng: request.lng };
  const markers = [
    { ...pacienteUbicacion, label: request.paciente_nombre ?? "Paciente", color: "blue" },
  ];
  if (doctorLocation) {
    markers.push({
      ...doctorLocation,
      label: request.medico_nombre ?? "Médico",
      color: "orange",
    });
  }
  const route = doctorLocation ? [doctorLocation, pacienteUbicacion] : null;
  const contraparte =
    user?.rol === "medico"
      ? { etiqueta: "Paciente", nombre: request.paciente_nombre }
      : { etiqueta: "Médico", nombre: request.medico_nombre };

  return (
    <div className="dashboard">
      <section className="panel">
        <div className="request-header">
          <h2>{request.tipo_procedimiento}</h2>
          <StatusBadge estado={request.estado} />
        </div>
        <div className="tag-row">
          <span className="tag">
            {MODALIDADES[request.modalidad]?.icon} {MODALIDADES[request.modalidad]?.label}
          </span>
          {request.programada_para ? (
            <span className="tag tag--cita">📅 Cita: {formatFechaHora(request.programada_para)}</span>
          ) : (
            <span className="tag tag--urgente">⚡ Atención inmediata</span>
          )}
        </div>
        <p>{request.descripcion}</p>
        {request.modalidad === "consultorio" && !request.medico_id && (
          <p className="notice-inline">
            🏥 Cuando un médico acepte tu solicitud, aquí verás la dirección de su consultorio.
          </p>
        )}
        {request.modalidad === "consultorio" && request.medico_id && (
          <div className="consultorio-card">
            <span aria-hidden="true">🏥</span>
            <div>
              <strong>
                {user?.rol === "medico" ? "El paciente acudirá a tu consultorio" : `Consultorio de ${request.medico_nombre}`}
              </strong>
              <p>{request.medico_direccion_consultorio || "Dirección aún no registrada"}</p>
              {request.medico_direccion_consultorio && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    request.medico_direccion_consultorio
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Cómo llegar (Google Maps) ↗
                </a>
              )}
            </div>
          </div>
        )}
        {contraparte.nombre && (
          <p className="form-hint">
            {contraparte.etiqueta}: {contraparte.nombre}
          </p>
        )}
        {error && <p className="form-error">{error}</p>}
        {doctorLocation && (
          <p className="form-hint">
            Distancia hasta el paciente: {formatDistancia(distanciaMetros)}
          </p>
        )}

        <MapView
          center={doctorLocation ?? pacienteUbicacion}
          markers={markers}
          route={route}
          height={360}
        />

        <div className="request-actions">
          {user?.rol === "paciente" &&
            ["pendiente", "aceptada"].includes(request.estado) && (
              <button className="btn btn-danger" onClick={handleCancel}>
                Cancelar solicitud
              </button>
            )}
        </div>

        {user?.rol === "medico" &&
          ["aceptada", "en_camino", "en_atencion"].includes(request.estado) && (
            <form className="request-form" onSubmit={handleFinish}>
              <h3>Finalizar atención</h3>
              <label>
                Diagnóstico
                <textarea
                  value={reportForm.diagnostico}
                  onChange={(e) =>
                    setReportForm((prev) => ({ ...prev, diagnostico: e.target.value }))
                  }
                />
              </label>
              <label>
                Procedimiento realizado
                <textarea
                  value={reportForm.procedimientoRealizado}
                  onChange={(e) =>
                    setReportForm((prev) => ({
                      ...prev,
                      procedimientoRealizado: e.target.value,
                    }))
                  }
                />
              </label>
              <label>
                Observaciones
                <textarea
                  value={reportForm.observaciones}
                  onChange={(e) =>
                    setReportForm((prev) => ({ ...prev, observaciones: e.target.value }))
                  }
                />
              </label>
              <label>
                Recomendaciones
                <textarea
                  value={reportForm.recomendaciones}
                  onChange={(e) =>
                    setReportForm((prev) => ({ ...prev, recomendaciones: e.target.value }))
                  }
                />
              </label>
              <button type="submit">Marcar como finalizada</button>
            </form>
          )}

        {report && (
          <div className="panel report-print">
            <div className="request-header">
              <h3>Reporte de atención</h3>
              <button type="button" className="btn btn-outline btn-sm no-print" onClick={() => window.print()}>
                🖨️ Imprimir / PDF
              </button>
            </div>
            <p className="form-hint">
              {request.tipo_procedimiento} · Paciente: {request.paciente_nombre} · Médico:{" "}
              {request.medico_nombre}
              {request.finalizado_en ? ` · ${formatFechaHora(request.finalizado_en)}` : ""}
            </p>
            <p>
              <strong>Diagnóstico:</strong> {report.diagnostico || "—"}
            </p>
            <p>
              <strong>Procedimiento realizado:</strong>{" "}
              {report.procedimiento_realizado || "—"}
            </p>
            <p>
              <strong>Observaciones:</strong> {report.observaciones || "—"}
            </p>
            <p>
              <strong>Recomendaciones:</strong> {report.recomendaciones || "—"}
            </p>
          </div>
        )}

        {user?.rol === "paciente" &&
          request.estado === "finalizada" &&
          !request.puntaje && (
            <form className="request-form" onSubmit={handleRate}>
              <h3>Califica la atención</h3>
              <label>
                Puntaje (1 a 5)
                <select
                  value={rating.puntaje}
                  onChange={(e) =>
                    setRating((prev) => ({ ...prev, puntaje: Number(e.target.value) }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Comentario
                <textarea
                  value={rating.comentario}
                  onChange={(e) =>
                    setRating((prev) => ({ ...prev, comentario: e.target.value }))
                  }
                />
              </label>
              <button type="submit">Enviar calificación</button>
            </form>
          )}
        {request.puntaje && (
          <p>
            Ya calificaste esta atención: ★ {request.puntaje}/5
            {request.calificacion_comentario ? ` — "${request.calificacion_comentario}"` : ""}
          </p>
        )}
      </section>

      {historial && (
        <section className="panel clinical-panel">
          <h2>🩺 Historial clínico de {historial.paciente.nombre}</h2>
          {!historial.ficha && (
            <p className="form-hint">El paciente aún no completó su ficha clínica.</p>
          )}
          {historial.ficha && (
            <>
              {historial.ficha.alergias && (
                <div className="allergy-alert" role="alert">
                  <strong>⚠️ Alergias:</strong> {historial.ficha.alergias}
                </div>
              )}
              <dl className="clinical-grid">
                <div>
                  <dt>DNI</dt>
                  <dd>{historial.ficha.dni || "—"}</dd>
                </div>
                <div>
                  <dt>Edad</dt>
                  <dd>
                    {calcularEdad(historial.ficha.fecha_nacimiento) ?? "—"}
                    {historial.ficha.fecha_nacimiento ? " años" : ""}
                  </dd>
                </div>
                <div>
                  <dt>Sexo</dt>
                  <dd className="capitalize">{historial.ficha.sexo || "—"}</dd>
                </div>
                <div>
                  <dt>Grupo sanguíneo</dt>
                  <dd>{historial.ficha.grupo_sanguineo || "—"}</dd>
                </div>
                <div className="clinical-grid-wide">
                  <dt>Antecedentes</dt>
                  <dd>{historial.ficha.antecedentes || "—"}</dd>
                </div>
                <div className="clinical-grid-wide">
                  <dt>Medicación actual</dt>
                  <dd>{historial.ficha.medicacion_actual || "—"}</dd>
                </div>
                <div className="clinical-grid-wide">
                  <dt>Contacto de emergencia</dt>
                  <dd>
                    {historial.ficha.contacto_emergencia_nombre || "—"}
                    {historial.ficha.contacto_emergencia_telefono
                      ? ` · ${historial.ficha.contacto_emergencia_telefono}`
                      : ""}
                  </dd>
                </div>
              </dl>
            </>
          )}
          <h3>Atenciones anteriores ({historial.atenciones.length})</h3>
          {historial.atenciones.length === 0 && <p className="form-hint">Sin atenciones previas.</p>}
          <ol className="timeline">
            {historial.atenciones.map((a) => (
              <li key={a.id} className="timeline-item">
                <div className="timeline-head">
                  <strong>{a.tipo_procedimiento}</strong>
                  <span className="form-hint">{formatFecha(a.finalizado_en)}</span>
                </div>
                <div className="form-hint">Atendido por {a.medico_nombre}</div>
                {a.diagnostico && (
                  <p>
                    <b>Diagnóstico:</b> {a.diagnostico}
                  </p>
                )}
                {a.procedimiento_realizado && (
                  <p>
                    <b>Procedimiento:</b> {a.procedimiento_realizado}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <p className="form-hint">🔒 Esta consulta queda registrada en la auditoría del sistema.</p>
        </section>
      )}

      <section className="panel no-print">
        <h2>Chat</h2>
        <div className="chat-messages">
          {messages.length === 0 && <p>Aún no hay mensajes.</p>}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`chat-bubble ${m.remitente_id === user?.id ? "chat-bubble--own" : ""}`}
            >
              {m.contenido}
            </div>
          ))}
        </div>
        {["aceptada", "en_camino", "en_atencion"].includes(request.estado) ? (
          <form className="chat-input" onSubmit={sendMessage}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escribe un mensaje..."
            />
            <button type="submit">Enviar</button>
          </form>
        ) : (
          <p className="form-hint">El chat ya no está disponible para esta solicitud.</p>
        )}
      </section>
    </div>
  );
}
