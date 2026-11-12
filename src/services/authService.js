import { api } from "./api";

export function login(email, password) {
  return api.post("/auth/login", { email, password }).then((res) => res.data);
}

export function updateProfile({ nombre, telefono }) {
  return api.patch("/auth/me", { nombre, telefono }).then((res) => res.data.usuario);
}

export function changePassword({ passwordActual, passwordNueva }) {
  return api
    .patch("/auth/me/password", { passwordActual, passwordNueva })
    .then((res) => res.data);
}

export function getMe() {
  return api.get("/auth/me").then((res) => res.data.usuario);
}

export function acceptConsent() {
  return api
    .post("/auth/me/consentimiento", { aceptaPrivacidad: true })
    .then((res) => res.data.usuario);
}

export function registerPaciente({ nombre, email, password, telefono, aceptaPrivacidad }) {
  return api
    .post("/auth/register/paciente", { nombre, email, password, telefono, aceptaPrivacidad })
    .then((res) => res.data);
}

export function registerMedico({
  nombre,
  email,
  password,
  telefono,
  cmpColegiatura,
  especialidad,
  aceptaPrivacidad,
}) {
  return api
    .post("/auth/register/medico", {
      nombre,
      email,
      password,
      telefono,
      cmpColegiatura,
      especialidad,
      aceptaPrivacidad,
    })
    .then((res) => res.data);
}
