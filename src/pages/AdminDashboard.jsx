import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createRespaldo,
  downloadRespaldo,
  downloadSolicitudesCsv,
  getAuditoria,
  getDashboard,
  getPendingDoctors,
  getRespaldos,
  getUsers,
  rejectDoctor,
  setUserStatus,
  verifyDoctor,
} from "../services/adminService";
import { AreaChart, BarList, SplitBar } from "../components/Charts";
import { StatusBadge } from "../components/StatusBadge";
import { formatBytes, formatFechaHora, MODALIDADES } from "../utils/formato";

const PERIODOS = [
  { dias: 7, label: "7 días" },
  { dias: 30, label: "30 días" },
  { dias: 90, label: "90 días" },
  { dias: 0, label: "Todo" },
];

const TABS = [
  { id: "resumen", label: "Resumen", icon: "📊" },
  { id: "medicos", label: "Médicos", icon: "👩‍⚕️" },
  { id: "usuarios", label: "Usuarios", icon: "👥" },
  { id: "seguridad", label: "Seguridad y respaldos", icon: "🛡️" },
];

const ESTADOS = ["pendiente", "aceptada", "en_camino", "en_atencion", "finalizada", "cancelada"];
const ACCIONES = {
  ver_historial_clinico: "Consultó historial clínico",
  crear_respaldo: "Creó un respaldo",
  descargar_respaldo: "Descargó un respaldo",
  supervisar_chat: "Supervisó el chat de una atención",
};

const num = (v) => (v === null || v === undefined ? null : Number(v));

function getInitials(nombre) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

// Completa con ceros los días sin solicitudes para que la tendencia sea fiel.
function serieDiaria(filas, dias) {
  const mapa = new Map(filas.map((f) => [f.dia, Number(f.total)]));
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  let inicio;
  if (dias > 0) {
    inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - (dias - 1));
  } else {
    inicio = filas.length ? new Date(`${filas[0].dia}T00:00:00`) : new Date(hoy);
  }
  const serie = [];
  const p = (n) => String(n).padStart(2, "0");
  for (let d = new Date(inicio); d <= hoy; d.setDate(d.getDate() + 1)) {
    const clave = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    serie.push({ x: clave, y: mapa.get(clave) ?? 0 });
  }
  return serie;
}

function formatDia(clave, largo) {
  const d = new Date(`${clave}T00:00:00`);
  return d.toLocaleDateString("es-PE", largo ? { weekday: "short", day: "numeric", month: "short" } : { day: "numeric", month: "short" });
}

function Estrellas({ valor }) {
  if (valor === null) return <span className="text-muted">Sin calificar</span>;
  return (
    <span className="stars" aria-label={`${valor} de 5`}>
      <span className="stars-fill" style={{ width: `${(valor / 5) * 100}%` }}>★★★★★</span>
      <span className="stars-empty">★★★★★</span>
      <b>{valor.toFixed(1)}</b>
    </span>
  );
}

function Kpi({ icon, label, value, unidad, detalle, tono = "neutral", destacado }) {
  return (
    <div className={`kpi-card ${destacado ? "kpi-card--hero" : ""}`}>
      <div className="kpi-top">
        <span className={`kpi-icon kpi-icon--${tono}`} aria-hidden="true">{icon}</span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">
        {value ?? "—"}
        {value !== null && value !== undefined && unidad && <small>{unidad}</small>}
      </div>
      {detalle && <div className="kpi-detail">{detalle}</div>}
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("resumen");
  const [dias, setDias] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendientes, setPendientes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [respaldos, setRespaldos] = useState([]);
  const [auditoria, setAuditoria] = useState([]);
  const [creandoRespaldo, setCreandoRespaldo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    loadPendientes();
  }, []);

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  useEffect(() => {
    if (tab === "usuarios") loadUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroRol, tab]);

  useEffect(() => {
    if (tab === "seguridad") loadSeguridad();
  }, [tab]);

  async function loadDashboard() {
    setLoading(true);
    try {
      setData(await getDashboard(dias));
    } catch {
      setError("No se pudo cargar el dashboard.");
    } finally {
      setLoading(false);
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

  async function loadSeguridad() {
    try {
      const [r, a] = await Promise.all([getRespaldos(), getAuditoria()]);
      setRespaldos(r);
      setAuditoria(a);
    } catch {
      setError("No se pudo cargar la información de seguridad.");
    }
  }

  async function handleVerify(id) {
    setBusyId(id);
    setError(null);
    try {
      await verifyDoctor(id);
      await Promise.all([loadPendientes(), loadDashboard()]);
      setAviso("Médico verificado. Ya puede iniciar sesión y aceptar solicitudes.");
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
      const params = {};
      if (dias > 0) params.desde = new Date(Date.now() - dias * 86400000).toISOString();
      await downloadSolicitudesCsv(params);
    } catch {
      setError("No se pudo generar el archivo CSV.");
    }
  }

  async function handleCrearRespaldo() {
    setCreandoRespaldo(true);
    setError(null);
    try {
      const r = await createRespaldo();
      setAviso(`Respaldo creado: ${r.nombre}`);
      await Promise.all([loadSeguridad(), loadDashboard()]);
    } catch {
      setError("No se pudo crear el respaldo.");
    } finally {
      setCreandoRespaldo(false);
    }
  }

  const r = data?.resumen;
  const serie = useMemo(() => (data ? serieDiaria(data.solicitudesPorDia, dias) : []), [data, dias]);

  const variacion = useMemo(() => {
    if (!r || r.total_periodo_anterior === null || r.total_periodo_anterior === undefined) return null;
    const actual = Number(r.total_solicitudes);
    const previo = Number(r.total_periodo_anterior);
    if (previo === 0) return actual > 0 ? "Sin datos del periodo anterior" : null;
    const pct = Math.round(((actual - previo) / previo) * 100);
    return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct)}% vs. periodo anterior`;
  }, [r]);

  const totalCalif = data?.calificaciones.reduce((a, c) => a + Number(c.total), 0) ?? 0;
  const usuariosFiltrados = usuarios.filter((u) =>
    `${u.nombre} ${u.email}`.toLowerCase().includes(busqueda.toLowerCase())
  );
  const horasDesdeRespaldo = data?.ultimoRespaldo
    ? (Date.now() - new Date(data.ultimoRespaldo.creado_en).getTime()) / 3600000
    : null;

  return (
    <div className="admin">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Administración</span>
          <h1 className="admin-title">Panel de control</h1>
          <p>Hola, {user?.nombre}. Indicadores de gestión de los servicios médicos de la plataforma.</p>
        </div>
        <div className="admin-header-actions">
          <div className="segmented" role="group" aria-label="Periodo">
            {PERIODOS.map((p) => (
              <button
                key={p.dias}
                type="button"
                className={dias === p.dias ? "is-active" : ""}
                aria-pressed={dias === p.dias}
                onClick={() => setDias(p.dias)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline" onClick={handleExport}>
            📥 Exportar CSV
          </button>
        </div>
      </div>

      <nav className="admin-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "is-active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
            {t.id === "medicos" && pendientes.length > 0 && <span className="tab-count">{pendientes.length}</span>}
          </button>
        ))}
      </nav>

      {error && <p className="form-error" role="alert">{error}</p>}
      {aviso && (
        <p className="form-success" role="status" onClick={() => setAviso(null)}>
          ✔ {aviso}
        </p>
      )}

      {tab === "resumen" && (
        <>
          {loading && !data && <p className="page-loading">Cargando indicadores...</p>}
          {data && (
            <div className={loading ? "is-refreshing" : ""}>
              {(pendientes.length > 0 || horasDesdeRespaldo === null || horasDesdeRespaldo > 26) && (
                <div className="alert-row">
                  {pendientes.length > 0 && (
                    <button className="alert-chip alert-chip--warning" onClick={() => setTab("medicos")}>
                      ⏳ {pendientes.length} médico(s) esperan verificación de CMP →
                    </button>
                  )}
                  {(horasDesdeRespaldo === null || horasDesdeRespaldo > 26) && (
                    <button className="alert-chip alert-chip--danger" onClick={() => setTab("seguridad")}>
                      🛡️ No hay un respaldo reciente de la base de datos →
                    </button>
                  )}
                </div>
              )}

              <div className="kpi-grid">
                <Kpi
                  destacado
                  icon="📋"
                  label="Solicitudes de atención"
                  value={num(r.total_solicitudes)}
                  detalle={variacion ?? `${num(r.total_finalizadas)} finalizadas`}
                  tono="primary"
                />
                <Kpi
                  icon="🤝"
                  label="Tasa de aceptación"
                  value={num(r.tasa_aceptacion_pct)}
                  unidad="%"
                  detalle={`${num(r.total_aceptadas)} aceptadas · ${num(r.total_canceladas)} canceladas`}
                  tono="accent"
                />
                <Kpi
                  icon="⏱️"
                  label="Tiempo hasta aceptación"
                  value={num(r.promedio_minutos_hasta_aceptacion)}
                  unidad="min"
                  detalle="Promedio en atenciones inmediatas"
                  tono="info"
                />
                <Kpi
                  icon="⭐"
                  label="Satisfacción de pacientes"
                  value={num(r.satisfaccion_promedio)}
                  unidad="/ 5"
                  detalle={`${num(r.total_calificaciones)} calificaciones`}
                  tono="warning"
                />
              </div>

              <div className="mini-kpi-row">
                <div className="mini-kpi">
                  <span>🟢 En curso ahora</span>
                  <b>{num(r.en_curso_ahora)}</b>
                </div>
                <div className="mini-kpi">
                  <span>🕒 Pendientes ahora</span>
                  <b>{num(r.pendientes_ahora)}</b>
                </div>
                <div className="mini-kpi">
                  <span>📅 Citas programadas</span>
                  <b>{num(r.total_programadas)}</b>
                </div>
                <div className="mini-kpi">
                  <span>⌛ Duración media de atención</span>
                  <b>{r.promedio_minutos_atencion_total !== null ? `${num(r.promedio_minutos_atencion_total)} min` : "—"}</b>
                </div>
                <div className="mini-kpi">
                  <span>🧑‍🤝‍🧑 Pacientes / 👩‍⚕️ Médicos</span>
                  <b>
                    {data.usuarios.paciente} / {data.usuarios.medico}
                  </b>
                </div>
              </div>

              <div className="dash-grid">
                <section className="panel dash-span-2">
                  <div className="panel-head">
                    <h2>Solicitudes por día</h2>
                    <span className="form-hint">
                      {dias > 0 ? `Últimos ${dias} días` : "Todo el historial"}
                    </span>
                  </div>
                  <AreaChart data={serie} formatX={formatDia} />
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>Estado de las solicitudes</h2>
                  </div>
                  <ul className="status-list">
                    {ESTADOS.map((e) => {
                      const total = Number(data.porEstado.find((x) => x.estado === e)?.total ?? 0);
                      const totalTodas = Number(r.total_solicitudes) || 1;
                      return (
                        <li key={e}>
                          <StatusBadge estado={e} />
                          <div className="status-list-track">
                            <div className="status-list-fill" style={{ width: `${(total / totalTodas) * 100}%` }} />
                          </div>
                          <b>{total}</b>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>Atenciones por procedimiento</h2>
                  </div>
                  <BarList
                    items={data.porTipo.map((t) => ({
                      label: t.tipo,
                      value: Number(t.total),
                      hint: `${t.finalizadas} fin.`,
                    }))}
                  />
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>Satisfacción de pacientes</h2>
                    <span className="form-hint">{totalCalif} respuestas</span>
                  </div>
                  <BarList
                    items={data.calificaciones.map((c) => ({
                      label: `${c.puntaje} ★`,
                      value: Number(c.total),
                    }))}
                    vacio="Aún no hay calificaciones en este periodo."
                  />
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>Modalidad de atención</h2>
                  </div>
                  <SplitBar
                    partes={[
                      { label: MODALIDADES.domicilio.label, icon: MODALIDADES.domicilio.icon, value: Number(r.total_domicilio) },
                      { label: MODALIDADES.consultorio.label, icon: MODALIDADES.consultorio.icon, value: Number(r.total_consultorio) },
                    ]}
                  />
                </section>

                <section className="panel dash-span-2">
                  <div className="panel-head">
                    <h2>📅 Próximas citas programadas</h2>
                  </div>
                  {data.proximasCitas.length === 0 ? (
                    <p className="chart-empty">No hay citas programadas próximas.</p>
                  ) : (
                    <div className="table-wrap">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Fecha y hora</th>
                            <th>Procedimiento</th>
                            <th>Paciente</th>
                            <th>Médico</th>
                            <th>Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.proximasCitas.map((c) => (
                            <tr key={c.id}>
                              <td className="nowrap">{formatFechaHora(c.programada_para)}</td>
                              <td>
                                <Link to={`/solicitud/${c.id}`}>{c.tipo_procedimiento}</Link>
                                <div className="admin-table-email">
                                  {MODALIDADES[c.modalidad]?.icon} {MODALIDADES[c.modalidad]?.label}
                                </div>
                              </td>
                              <td>{c.paciente_nombre}</td>
                              <td>{c.medico_nombre ?? <span className="text-muted">Sin asignar</span>}</td>
                              <td>
                                <StatusBadge estado={c.estado} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                <section className="panel">
                  <div className="panel-head">
                    <h2>🛡️ Último respaldo</h2>
                  </div>
                  {data.ultimoRespaldo ? (
                    <div className="backup-summary">
                      <b>{formatFechaHora(data.ultimoRespaldo.creado_en)}</b>
                      <span className="form-hint">
                        {data.ultimoRespaldo.origen === "automatico" ? "Automático" : "Manual"} ·{" "}
                        {formatBytes(data.ultimoRespaldo.tamano_bytes)}
                      </span>
                    </div>
                  ) : (
                    <p className="chart-empty">Aún no hay respaldos.</p>
                  )}
                  <button className="btn btn-outline btn-sm" onClick={() => setTab("seguridad")}>
                    Gestionar respaldos →
                  </button>
                </section>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "medicos" && (
        <>
          <section className="panel">
            <div className="panel-head">
              <h2>Médicos pendientes de verificación</h2>
              <span className="form-hint">Valida el CMP en el registro del Colegio Médico antes de aprobar.</span>
            </div>
            {pendientes.length === 0 && <p className="chart-empty">✔ No hay médicos pendientes.</p>}
            <div className="request-list">
              {pendientes.map((m) => (
                <div key={m.id} className="pending-card">
                  <div className="staff-avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
                    {getInitials(m.nombre)}
                  </div>
                  <div className="pending-card-body">
                    <strong>{m.nombre}</strong>
                    <p>
                      {m.email} · CMP <b>{m.cmp_colegiatura}</b> · {m.especialidad}
                    </p>
                  </div>
                  <div className="request-list-item-actions">
                    <button className="btn btn-success btn-sm" onClick={() => handleVerify(m.id)} disabled={busyId === m.id}>
                      {busyId === m.id ? "Verificando..." : "✔ Verificar"}
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleReject(m.id)} disabled={busyId === m.id}>
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Desempeño por médico</h2>
              <span className="form-hint">{dias > 0 ? `Últimos ${dias} días` : "Todo el historial"}</span>
            </div>
            {!data && <p className="page-loading">Cargando...</p>}
            {data && (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Médico</th>
                      <th className="num">Aceptadas</th>
                      <th className="num">Finalizadas</th>
                      <th>Satisfacción</th>
                      <th className="num">Min. promedio</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.medicos.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <div className="admin-table-name">{m.nombre}</div>
                          <div className="admin-table-email">{m.especialidad}</div>
                        </td>
                        <td className="num">{m.aceptadas}</td>
                        <td className="num">{m.finalizadas}</td>
                        <td>
                          <Estrellas valor={num(m.satisfaccion_promedio)} />
                          {Number(m.calificaciones) > 0 && (
                            <div className="admin-table-email">{m.calificaciones} calificaciones</div>
                          )}
                        </td>
                        <td className="num">{m.minutos_promedio_atencion ?? "—"}</td>
                        <td>
                          <span className={`estado-dot ${!m.disponible ? "estado-dot--inactivo" : ""}`}>
                            {m.disponible ? "En línea" : "Fuera de línea"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {tab === "usuarios" && (
        <section className="panel">
          <div className="panel-head">
            <h2>Usuarios</h2>
            <div className="toolbar">
              <input
                type="search"
                placeholder="Buscar por nombre o correo"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar usuario"
              />
              <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} aria-label="Filtrar por rol">
                <option value="">Todos los roles</option>
                <option value="paciente">Pacientes</option>
                <option value="medico">Médicos</option>
                <option value="admin">Admins</option>
              </select>
            </div>
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
                {usuariosFiltrados.map((u) => (
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
                    <td className="num">
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
                {usuariosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={4} className="chart-empty">Sin resultados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "seguridad" && (
        <div className="dash-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>🛡️ Copias de seguridad</h2>
            </div>
            <p className="form-hint">
              El sistema genera un respaldo automático cada 24 horas y conserva los 14 más recientes.
              También puedes crear uno manualmente antes de un cambio importante.
            </p>
            <button className="btn btn-primary" onClick={handleCrearRespaldo} disabled={creandoRespaldo}>
              {creandoRespaldo ? "Creando respaldo..." : "Crear respaldo ahora"}
            </button>
            <ul className="backup-list">
              {respaldos.length === 0 && <li className="chart-empty">Aún no hay respaldos.</li>}
              {respaldos.map((b) => (
                <li key={b.nombre}>
                  <span className="backup-icon" aria-hidden="true">{b.origen === "automatico" ? "🤖" : "👤"}</span>
                  <span className="backup-body">
                    <b>{formatFechaHora(b.creado_en)}</b>
                    <small>
                      {b.origen === "automatico" ? "Automático" : "Manual"} · {formatBytes(b.tamano_bytes)}
                    </small>
                  </span>
                  <button className="btn btn-outline btn-sm" onClick={() => downloadRespaldo(b.nombre)}>
                    Descargar
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel dash-span-2">
            <div className="panel-head">
              <h2>🔎 Auditoría de accesos</h2>
              <span className="form-hint">Últimos 100 registros</span>
            </div>
            <p className="form-hint">
              Cada vez que un médico o administrador consulta un historial clínico, o se gestiona un
              respaldo, queda registrado aquí.
            </p>
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Usuario</th>
                    <th>Acción</th>
                    <th>Paciente / detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoria.map((a) => (
                    <tr key={a.id}>
                      <td className="nowrap">{formatFechaHora(a.creado_en)}</td>
                      <td>
                        <div className="admin-table-name">{a.usuario_nombre ?? "—"}</div>
                        {a.usuario_rol && <span className={`role-badge role-badge--${a.usuario_rol}`}>{a.usuario_rol}</span>}
                      </td>
                      <td>{ACCIONES[a.accion] ?? a.accion}</td>
                      <td>
                        {a.paciente_nombre ?? ""}
                        {a.solicitud_id && (
                          <div className="admin-table-email">
                            <Link to={`/solicitud/${a.solicitud_id}`}>Solicitud #{a.solicitud_id}</Link>
                          </div>
                        )}
                        {a.detalle && <div className="admin-table-email">{a.detalle}</div>}
                      </td>
                    </tr>
                  ))}
                  {auditoria.length === 0 && (
                    <tr>
                      <td colSpan={4} className="chart-empty">Sin registros todavía.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
