import { api } from "./api";

export function getDashboard(dias = 30) {
  return api.get("/admin/dashboard", { params: { dias } }).then((res) => res.data);
}

export function getPendingDoctors() {
  return api.get("/admin/medicos/pendientes").then((res) => res.data.medicos);
}

export function verifyDoctor(id) {
  return api.patch(`/admin/medicos/${id}/verificar`).then((res) => res.data);
}

export function rejectDoctor(id) {
  return api.delete(`/admin/medicos/${id}/rechazar`).then((res) => res.data);
}

export function getUsers(rol) {
  return api
    .get("/admin/usuarios", { params: rol ? { rol } : {} })
    .then((res) => res.data.usuarios);
}

export function setUserStatus(id, activo) {
  return api
    .patch(`/admin/usuarios/${id}/estado`, { activo })
    .then((res) => res.data.usuario);
}

export async function downloadSolicitudesCsv({ desde, hasta } = {}) {
  const res = await api.get("/admin/reportes/solicitudes.csv", {
    params: { desde, hasta },
    responseType: "blob",
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = "solicitudes.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
