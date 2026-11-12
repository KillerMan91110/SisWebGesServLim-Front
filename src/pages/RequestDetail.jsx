import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { MapView } from "../components/MapView";
import { StatusBadge } from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import {
  cancelRequest,
  finishRequest,
  registrarLlegada,
  getMessages,
  getRequest,
  getHistorialClinico,
  getReport,
  rateRequest,
} from "../services/requestService";
import { calcularEdad, formatFecha, formatFechaHora, MODALIDADES } from "../utils/formato";
import { connectSocket } from "../services/socket";
import { textoDistancia, textoDuracion, useRuta } from "../utils/useRuta";

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
  const [pacienteLive, setPacienteLive] = useState(null);
  const watchIdRef = useRef(null);
  const [historial, setHistorial] = useState(null);
  const chatBoxRef = useRef(null);
  const [escribiendo, setEscribiendo] = useState({});
  const timersEscribiendo = useRef({});
  const ultimoAvisoRef = useRef(0);
  const pararEscribirRef = useRef(null);
  const cuantosEscriben = Object.keys(escribiendo).length;

  // Mantener visible el último mensaje del chat (solo se desplaza la caja, no la página)
  useEffect(() => {
    const caja = chatBoxRef.current;
    if (caja) caja.scrollTop = caja.scrollHeight;
  }, [messages.length, cuantosEscriben]);

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
    socket.on("ubicacion:paciente", (p) => {
      if (String(p.solicitudId) === String(id)) {
        setPacienteLive({ lat: p.lat, lng: p.lng });
      }
    });
    socket.on("mensaje:nuevo", (msg) => {
      if (String(msg.solicitud_id) === String(id)) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        quitarEscribiendo(msg.remitente_id);
      }
    });
    socket.on("chat:escribiendo", (p) => {
      if (String(p.solicitudId) !== String(id)) return;
      if (!p.escribiendo) return quitarEscribiendo(p.usuarioId);
      setEscribiendo((prev) => ({ ...prev, [p.usuarioId]: { nombre: p.nombre, rol: p.rol } }));
      // Seguridad: si no llega el "dejó de escribir", se apaga solo a los 5 s
      clearTimeout(timersEscribiendo.current[p.usuarioId]);
      timersEscribiendo.current[p.usuarioId] = setTimeout(() => quitarEscribiendo(p.usuarioId), 5000);
    });
    // El evento trae la fila sin los datos unidos (nombres, consultorio):
    // se vuelve a pedir la solicitud completa para no perderlos.
    socket.on("solicitud:actualizada", (updated) => {
      if (String(updated.id) === String(id)) {
        getRequest(id).then(setRequest).catch(() => setRequest((prev) => ({ ...prev, ...updated })));
      }
    });

    return () => {
      socket.emit("chat:escribiendo", { solicitudId: id, escribiendo: false });
      socket.emit("solicitud:salir", id);
      socket.off("ubicacion:medico");
      socket.off("ubicacion:paciente");
      socket.off("mensaje:nuevo");
      socket.off("chat:escribiendo");
      socket.off("solicitud:actualizada");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function quitarEscribiendo(usuarioId) {
    clearTimeout(timersEscribiendo.current[usuarioId]);
    setEscribiendo((prev) => {
      if (!prev[usuarioId]) return prev;
      const { [usuarioId]: _fuera, ...resto } = prev;
      return resto;
    });
  }

  // Avisa a la otra persona que estoy escribiendo (como máximo cada 1,5 s)
  // y que dejé de hacerlo tras 2 s sin teclear.
  function avisarEscribiendo() {
    const socket = connectSocket();
    const ahora = Date.now();
    if (ahora - ultimoAvisoRef.current > 1500) {
      socket.emit("chat:escribiendo", { solicitudId: id, escribiendo: true });
      ultimoAvisoRef.current = ahora;
    }
    clearTimeout(pararEscribirRef.current);
    pararEscribirRef.current = setTimeout(() => {
      socket.emit("chat:escribiendo", { solicitudId: id, escribiendo: false });
      ultimoAvisoRef.current = 0;
    }, 2000);
  }

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

  // Consultorio: el paciente comparte su ubicación mientras va al consultorio
  useEffect(() => {
    if (user?.rol !== "paciente" || !navigator.geolocation) return;
    if (request?.modalidad !== "consultorio") return;
    if (!["aceptada", "en_camino"].includes(request?.estado)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const posicion = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPacienteLive(posicion);
        connectSocket().emit("ubicacion:paciente", { solicitudId: id, ...posicion });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [id, user?.rol, request?.estado, request?.modalidad]);

  function sendMessage(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    const socket = connectSocket();
    socket.emit("mensaje:enviar", { solicitudId: id, contenido: draft }, (ack) => {
      if (ack?.error) setError(ack.error);
    });
    clearTimeout(pararEscribirRef.current);
    socket.emit("chat:escribiendo", { solicitudId: id, escribiendo: false });
    ultimoAvisoRef.current = 0;
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

  async function handleLlegada() {
    try {
      await registrarLlegada(id);
      setRequest(await getRequest(id));
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo registrar la llegada.");
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

  // Seguimiento: médico -> domicilio del paciente, o paciente -> consultorio del médico
  const esConsultorio = request?.modalidad === "consultorio";
  const consultorio =
    request?.medico_consultorio_lat != null
      ? { lat: request.medico_consultorio_lat, lng: request.medico_consultorio_lng }
      : null;
  const casaPaciente = request ? { lat: request.lat, lng: request.lng } : null;
  const enSeguimiento = ["aceptada", "en_camino"].includes(request?.estado);
  const origenRuta = enSeguimiento ? (esConsultorio ? pacienteLive : doctorLocation) : null;
  const destinoRuta = esConsultorio ? consultorio : casaPaciente;
  const ruta = useRuta(origenRuta, destinoRuta);

  if (error && !request) return <p className="form-error">{error}</p>;
  if (!request) return <p>Cargando...</p>;

  const markers = [];
  if (esConsultorio) {
    if (consultorio) {
      markers.push({ ...consultorio, label: `Consultorio · ${request.medico_nombre ?? ""}`, color: "green" });
    }
    markers.push({
      ...(pacienteLive ?? casaPaciente),
      label: pacienteLive ? `${request.paciente_nombre ?? "Paciente"} (en camino)` : "Ubicación del paciente",
      color: "blue",
    });
  } else {
    markers.push({ ...casaPaciente, label: `Domicilio · ${request.paciente_nombre ?? ""}`, color: "blue" });
    if (doctorLocation) {
      markers.push({ ...doctorLocation, label: request.medico_nombre ?? "Médico", color: "orange" });
    }
  }
  const route = ruta?.puntos ?? null;
  const centroMapa = origenRuta ?? destinoRuta ?? casaPaciente;
  const soyMedico = user?.rol === "medico";
  const distanciaTexto = textoDistancia(ruta?.distanciaM ?? distanciaMetros);
  const tiempoTexto = textoDuracion(ruta?.duracionS);
  let seguimiento = null;
  if (origenRuta && destinoRuta) {
    seguimiento = esConsultorio
      ? soyMedico
        ? `🚶 ${request.paciente_nombre} está a ${distanciaTexto} de tu consultorio`
        : `🏥 Estás a ${distanciaTexto} del consultorio`
      : soyMedico
        ? `🚗 Estás a ${distanciaTexto} del domicilio del paciente`
        : `🚗 ${request.medico_nombre} está a ${distanciaTexto} de tu domicilio`;
  }
  const contraparte =
    user?.rol === "medico"
      ? { etiqueta: "Paciente", nombre: request.paciente_nombre }
      : { etiqueta: "Médico", nombre: request.medico_nombre };
  const chatActivo = ["aceptada", "en_camino", "en_atencion"].includes(request.estado);
  // El admin que no es parte de la solicitud ve el chat en modo supervisión (solo lectura)
  const supervision =
    user?.rol === "admin" && request.paciente_id !== user?.id && request.medico_id !== user?.id;

  return (
    <div className="detail-layout">
      <div className="detail-main">
      <section className="panel">
        <div className="request-header">
          <h2>{request.tipo_procedimiento}</h2>
          <div className="request-header-actions">
            <StatusBadge estado={request.estado} />
            <a href="#chat" className="btn btn-outline btn-sm solo-movil">
              💬 Ir al chat
            </a>
          </div>
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
        {seguimiento && (
          <div className="tracking-bar" role="status">
            <strong>{seguimiento}</strong>
            {tiempoTexto && <span className="tracking-eta">⏱️ llega en ~{tiempoTexto}</span>}
            {ruta?.aproximada && <small>Distancia en línea recta (ruta no disponible)</small>}
          </div>
        )}
        {esConsultorio && request.medico_id && !consultorio && enSeguimiento && (
          <p className="form-hint">
            📍 El médico aún no marcó su consultorio en el mapa; el seguimiento de la ruta se activará
            cuando lo haga.
          </p>
        )}
        {esConsultorio && user?.rol === "paciente" && enSeguimiento && (
          <p className="form-hint">
            📡 Compartimos tu ubicación con el médico mientras vas al consultorio. Al llegar se
            registra sola tu llegada.
          </p>
        )}

        <MapView center={centroMapa} markers={markers} route={route} height={360} />
        <div className="map-legend">
          {esConsultorio ? (
            <>
              <span>
                <i style={{ background: "#1f9d55" }} /> Consultorio
              </span>
              <span>
                <i style={{ background: "var(--primary)" }} /> Paciente
              </span>
            </>
          ) : (
            <>
              <span>
                <i style={{ background: "var(--primary)" }} /> Domicilio del paciente
              </span>
              <span>
                <i style={{ background: "var(--warning)" }} /> Médico
              </span>
            </>
          )}
        </div>

        <div className="request-actions">
          {user?.rol === "paciente" &&
            ["pendiente", "aceptada"].includes(request.estado) && (
              <button className="btn btn-danger" onClick={handleCancel}>
                Cancelar solicitud
              </button>
            )}
          {esMedicoAsignado && request.modalidad === "consultorio" && request.estado === "aceptada" && (
            <button className="btn btn-success" onClick={handleLlegada}>
              🏥 Paciente llegó al consultorio
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

      </div>

      <aside id="chat" className="detail-side no-print">
        <section className="panel chat-panel">
          {supervision ? (
            <div className="chat-head chat-head--supervision">
              <span className="chat-avatar" aria-hidden="true">👁️</span>
              <div>
                <strong>Supervisión del chat</strong>
                <small>
                  🧑 {request.paciente_nombre ?? "Paciente"} · 🩺 {request.medico_nombre ?? "Sin médico asignado"}
                </small>
              </div>
            </div>
          ) : (
            <div className="chat-head">
              <span className="chat-avatar" aria-hidden="true">
                {user?.rol === "medico" ? "🧑" : "🩺"}
              </span>
              <div>
                <strong>{contraparte.nombre ?? "Esperando a un médico"}</strong>
                <small>
                  {Object.keys(escribiendo).length > 0
                    ? "escribiendo..."
                    : contraparte.nombre
                      ? contraparte.etiqueta
                      : "El chat se habilita al aceptar"}
                </small>
              </div>
            </div>
          )}
          <div className="chat-messages" ref={chatBoxRef} aria-live="polite">
            {messages.length === 0 && (
              <p className="chat-empty">
                {chatActivo && !supervision
                  ? "Aún no hay mensajes. Escribe para coordinar los detalles de la atención."
                  : "Aún no hay mensajes."}
              </p>
            )}
            {messages.map((m, i) => {
              const propio = m.remitente_id === user?.id;
              // En supervisión: médico a la derecha, paciente a la izquierda
              const derecha = supervision ? m.remitente_rol === "medico" : propio;
              const mostrarNombre = i === 0 || messages[i - 1].remitente_id !== m.remitente_id;
              return (
                <div key={m.id} className={`chat-row ${derecha ? "chat-row--right" : ""}`}>
                  {mostrarNombre && (
                    <span className="chat-author">
                      {propio ? "Tú" : m.remitente_nombre ?? "Usuario"}
                      {m.remitente_rol && !propio && (
                        <em>{m.remitente_rol === "medico" ? " · Médico" : " · Paciente"}</em>
                      )}
                    </span>
                  )}
                  <div
                    className={`chat-bubble ${derecha ? "chat-bubble--own" : ""} ${
                      supervision && m.remitente_rol === "paciente" ? "chat-bubble--paciente" : ""
                    }`}
                  >
                    {m.contenido}
                    {m.enviado_en && (
                      <time>
                        {new Date(m.enviado_en).toLocaleTimeString("es-PE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    )}
                  </div>
                </div>
              );
            })}
            {Object.entries(escribiendo).map(([uid, quien]) => (
              <div
                key={`typing-${uid}`}
                className={`chat-row ${supervision && quien.rol === "medico" ? "chat-row--right" : ""}`}
              >
                <span className="chat-author">
                  {quien.nombre} está escribiendo
                </span>
                <div className="chat-bubble chat-typing" aria-label={`${quien.nombre} está escribiendo`}>
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            ))}
          </div>
          {supervision ? (
            <p className="form-hint chat-supervision-note">
              🔒 Modo supervisión: solo lectura. Los mensajes llegan en tiempo real y este acceso queda
              registrado en la auditoría.
            </p>
          ) : chatActivo ? (
            <form className="chat-input" onSubmit={sendMessage}>
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (e.target.value.trim()) avisarEscribiendo();
                }}
                placeholder="Escribe un mensaje..."
                aria-label="Mensaje"
              />
              <button type="submit">Enviar</button>
            </form>
          ) : (
            <p className="form-hint">
              {request.estado === "pendiente"
                ? "Podrás chatear cuando un médico acepte la solicitud."
                : "El chat ya no está disponible para esta solicitud."}
            </p>
          )}
        </section>
      </aside>
    </div>
  );
}
