import { useEffect, useMemo, useState } from "react";
import { MapView } from "./MapView";
import { getMedicosCercanos } from "../services/medicoService";
import { connectSocket } from "../services/socket";

function iniciales(nombre) {
  return nombre
    .replace(/^(Dr|Dra)\.\s*/i, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function distancia(m) {
  const v = Number(m);
  return v < 1000 ? `${v} m` : `${(v / 1000).toFixed(1)} km`;
}

/** Médicos verificados y en línea cerca del paciente (mapa + lista). */
export function NearbyDoctors({ location }) {
  const [medicos, setMedicos] = useState([]);
  const [radioKm, setRadioKm] = useState(10);
  const [cargando, setCargando] = useState(true);

  const lat = location?.lat;
  const lng = location?.lng;

  useEffect(() => {
    if (lat == null || lng == null) return;
    let activo = true;
    const cargar = () =>
      getMedicosCercanos(lat, lng, radioKm * 1000)
        .then((m) => activo && setMedicos(m))
        .catch(() => activo && setMedicos([]))
        .finally(() => activo && setCargando(false));
    cargar();
    // Al instante cuando un médico se conecta o desconecta, y además cada minuto
    const socket = connectSocket();
    socket.on("medicos:disponibilidad", cargar);
    const intervalo = setInterval(cargar, 60000);
    return () => {
      activo = false;
      socket.off("medicos:disponibilidad", cargar);
      clearInterval(intervalo);
    };
  }, [lat, lng, radioKm]);

  const markers = useMemo(
    () => [
      ...(location ? [{ lat: location.lat, lng: location.lng, label: "Tú", color: "blue" }] : []),
      ...medicos.map((m) => ({
        lat: m.lat,
        lng: m.lng,
        label: `${m.nombre} · ${m.especialidad} · a ${distancia(m.distancia_metros)}`,
        color: "green",
      })),
    ],
    [location, medicos]
  );

  return (
    <section className="panel dashboard-full nearby">
      <div className="panel-head">
        <div>
          <h2>🩺 Médicos disponibles cerca de ti</h2>
          <p className="form-hint">
            Profesionales con CMP verificado que están en línea ahora. La ubicación es aproximada.
          </p>
        </div>
        <label className="radio-select">
          Radio
          <select value={radioKm} onChange={(e) => setRadioKm(Number(e.target.value))}>
            {[3, 5, 10, 20].map((km) => (
              <option key={km} value={km}>
                {km} km
              </option>
            ))}
          </select>
        </label>
      </div>

      {!location ? (
        <p className="chart-empty">Activa tu ubicación para ver los médicos cercanos.</p>
      ) : (
        <div className="nearby-grid">
          <div>
            <MapView center={location} markers={markers} zoom={13} height={320} />
            <div className="map-legend">
              <span>
                <i style={{ background: "var(--primary)" }} /> Tú
              </span>
              <span>
                <i style={{ background: "#1f9d55" }} /> Médicos en línea
              </span>
            </div>
          </div>
          <div className="nearby-list">
            {cargando && <p className="chart-empty">Buscando médicos...</p>}
            {!cargando && medicos.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">🔍</span>
                <p>
                  No hay médicos en línea en un radio de {radioKm} km. Igual puedes publicar tu
                  solicitud o programar una cita: te avisaremos cuando un médico la acepte.
                </p>
              </div>
            )}
            {medicos.map((m) => (
              <div key={m.id} className="doctor-card">
                <span className="doctor-avatar" aria-hidden="true">
                  {iniciales(m.nombre)}
                  <i className="doctor-online" />
                </span>
                <div className="doctor-body">
                  <strong>{m.nombre}</strong>
                  <span>{m.especialidad}</span>
                  <small>
                    📍 a {distancia(m.distancia_metros)}
                    {m.satisfaccion ? ` · ★ ${Number(m.satisfaccion).toFixed(1)}` : ""} ·{" "}
                    {m.atenciones} atenciones
                  </small>
                  {m.direccion_consultorio && <small>🏥 {m.direccion_consultorio}</small>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
