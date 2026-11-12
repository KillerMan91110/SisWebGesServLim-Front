import { api } from "./api";

export function getNotificaciones() {
  return api.get("/notificaciones").then((res) => res.data);
}

export function marcarLeida(id) {
  return api.patch(`/notificaciones/${id}/leida`);
}

export function marcarTodasLeidas() {
  return api.patch("/notificaciones/leer-todas");
}
