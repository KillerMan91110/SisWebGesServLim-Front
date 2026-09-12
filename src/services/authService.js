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

export function registerPaciente({ nombre, email, password, telefono }) {
  return api
    .post("/auth/register/paciente", { nombre, email, password, telefono })
    .then((res) => res.data);
}

export function registerMedico({
  nombre,
  email,
  password,
  telefono,
  cmpColegiatura,
  especialidad,
}) {
  return api
    .post("/auth/register/medico", {
      nombre,
      email,
      password,
      telefono,
      cmpColegiatura,
      especialidad,
    })
    .then((res) => res.data);
}
