import { api } from "./api";

export function createRequest({ tipoProcedimiento, descripcion, lat, lng, modalidad, programadaPara }) {
  return api
    .post("/solicitudes", { tipoProcedimiento, descripcion, lat, lng, modalidad, programadaPara })
    .then((res) => res.data.solicitud);
}

export function registrarLlegada(id) {
  return api.post(`/solicitudes/${id}/llegada`).then((res) => res.data.solicitud);
}

export function getAgenda() {
  return api.get("/solicitudes/agenda").then((res) => res.data.citas);
}

export function getHistorialClinico(id) {
  return api.get(`/solicitudes/${id}/historial-clinico`).then((res) => res.data);
}

export function getMyRequests() {
  return api.get("/solicitudes/mias").then((res) => res.data.solicitudes);
}

export function getAttendedRequests() {
  return api.get("/solicitudes/atendidas").then((res) => res.data.solicitudes);
}

export function getNearbyRequests(lat, lng) {
  return api
    .get("/solicitudes/cercanas", { params: { lat, lng } })
    .then((res) => res.data.solicitudes);
}

export function getRequest(id) {
  return api.get(`/solicitudes/${id}`).then((res) => res.data.solicitud);
}

export function acceptRequest(id) {
  return api.post(`/solicitudes/${id}/aceptar`).then((res) => res.data.solicitud);
}

export function cancelRequest(id) {
  return api.patch(`/solicitudes/${id}/cancelar`).then((res) => res.data.solicitud);
}

export function finishRequest(id, reporte = {}) {
  return api
    .post(`/solicitudes/${id}/finalizar`, reporte)
    .then((res) => res.data.solicitud);
}

export function getMessages(id) {
  return api.get(`/solicitudes/${id}/mensajes`).then((res) => res.data.mensajes);
}

export function getReport(id) {
  return api.get(`/solicitudes/${id}/reporte`).then((res) => res.data.reporte);
}

export function rateRequest(id, { puntaje, comentario }) {
  return api
    .post(`/solicitudes/${id}/calificar`, { puntaje, comentario })
    .then((res) => res.data.calificacion);
}
