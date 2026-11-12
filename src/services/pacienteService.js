import { api } from "./api";

export function getFicha() {
  return api.get("/pacientes/me/ficha").then((res) => res.data.ficha);
}

export function saveFicha(ficha) {
  return api.put("/pacientes/me/ficha", ficha).then((res) => res.data.ficha);
}

export function getMiHistorial() {
  return api.get("/pacientes/me/historial").then((res) => res.data);
}
