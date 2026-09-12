import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  downloadSolicitudesCsv,
  getDashboard,
  getPendingDoctors,
  getUsers,
  rejectDoctor,
  setUserStatus,
  verifyDoctor,
} from "../services/adminService";

const RESUMEN = [
  { key: "total_solicitudes", label: "Solicitudes totales", icon: "📋" },
  { key: "total_aceptadas", label: "Aceptadas", icon: "🤝" },
  { key: "total_finalizadas", label: "Finalizadas", icon: "✅" },
  { key: "total_canceladas", label: "Canceladas", icon: "🚫" },
  { key: "tasa_aceptacion_pct", label: "Tasa de aceptación (%)", icon: "📈" },
  { key: "promedio_minutos_hasta_aceptacion", label: "Min. hasta aceptación", icon: "⏱️" },
  { key: "promedio_minutos_atencion_total", label: "Min. de atención total", icon: "🕒" },
];

function getInitials(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState(null);
  const [usuariosResumen, setUsuariosResumen] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadDashboard();
    loadPendientes();
  }, []);

  useEffect(() => {
    loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol]);

  async function loadDashboard() {
    try {
      const data = await getDashboard(30);
      setResumen(data.resumen);
      setUsuariosResumen(data.usuarios);
    } catch {
      setError("No se pudo cargar el dashboard.");
    }
  }

  async function loadPendientes() {
    try {
      setPendientes(await getPendingDoctors());
    } catch {
      setPendientes([]);
    }
  }

  async function loadUsuarios() {
    try {
      setUsuarios(await getUsers(filtroRol || undefined));
    } catch {
      setUsuarios([]);
    }
  }

  async function handleVerify(id) {
    setBusyId(id);
    setError(null);
    try {
      await verifyDoctor(id);
      await Promise.all([loadPendientes(), loadDashboard(), loadUsuarios()]);
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo verificar al médico.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    if (!window.confirm("¿Rechazar este registro de médico? Se eliminará la cuenta.")) return;
    setBusyId(id);
    setError(null);
    try {
      await rejectDoctor(id);
      await Promise.all([loadPendientes(), loadDashboard()]);
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo rechazar al médico.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleEstado(u) {
    setBusyId(u.id);
    setError(null);
    try {
      await setUserStatus(u.id, !u.activo);
      await loadUsuarios();
    } catch (err) {
      setError(err.response?.data?.error ?? "No se pudo actualizar el estado del usuario.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleExport() {
    try {
      await downloadSolicitudesCsv();
    } catch {
      setError("No se pudo generar el archivo CSV.");
    }
  }

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <h1 style={{ margin: 0, fontSize: 26 }}>Panel de administración</h1>
          <p>Verifica profesionales, gestiona usuarios y revisa el desempeño de la plataforma.</p>
        </div>
        <button className="btn btn-outline" onClick={handleExport}>
          📥 Exportar solicitudes (CSV)
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      <section className="panel">
        <h2>Resumen (últimos 30 días)</h2>
        {resumen && (
          <div className="admin-stat-row">
            {RESUMEN.map(({ key, label, icon }) => (
              <div key={key} className="admin-stat-card">
                <span className="admin-stat-icon">{icon}</span>
                <div>
                  <div className="stat-value">{resumen[key] ?? "—"}</div>
                  <div className="stat-label">{label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {usuariosResumen && (
          <div className="admin-stat-row">
            <div className="admin-stat-card">
              <span className="admin-stat-icon">🧑‍🤝‍🧑</span>
              <div>
                <div className="stat-value">{usuariosResumen.paciente}</div>
                <div className="stat-label">Pacientes</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-icon">👩‍⚕️</span>
              <div>
                <div className="stat-value">{usuariosResumen.medico}</div>
                <div className="stat-label">Médicos</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <span className="admin-stat-icon">⏳</span>
              <div>
                <div className="stat-value">{usuariosResumen.medicosPendientesVerificacion}</div>
                <div className="stat-label">Médicos por verificar</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Médicos pendientes de verificación</h2>
        {pendientes.length === 0 && <p>No hay médicos pendientes.</p>}
        <div className="request-list">
          {pendientes.map((m) => (
            <div key={m.id} className="pending-card">
              <div className="staff-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                {getInitials(m.nombre)}
              </div>
              <div className="pending-card-body">
                <strong>{m.nombre}</strong>
                <p>
                  {m.email} · CMP {m.cmp_colegiatura} · {m.especialidad}
                </p>
              </div>
              <div className="request-list-item-actions">
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleVerify(m.id)}
                  disabled={busyId === m.id}
                >
                  {busyId === m.id ? "Verificando..." : "Verificar"}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleReject(m.id)}
                  disabled={busyId === m.id}
                >
                  Rechazar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="request-header">
          <h2>Usuarios</h2>
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
            <option value="">Todos los roles</option>
            <option value="paciente">Pacientes</option>
            <option value="medico">Médicos</option>
            <option value="admin">Admins</option>
          </select>
        </div>
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="admin-table-name">{u.nombre}</div>
                    <div className="admin-table-email">{u.email}</div>
                  </td>
                  <td>
                    <span className={`role-badge role-badge--${u.rol}`}>{u.rol}</span>
                  </td>
                  <td>
                    <span className={`estado-dot ${!u.activo ? "estado-dot--inactivo" : ""}`}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.activo ? "btn-danger" : "btn-success"}`}
                      onClick={() => handleToggleEstado(u)}
                      disabled={busyId === u.id || u.id === user?.id}
                    >
                      {u.activo ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
