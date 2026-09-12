import { createContext, useContext, useState } from "react";
import * as authService from "../services/authService";
import { connectSocket, disconnectSocket } from "../services/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  function persistSession({ usuario, token }) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(usuario));
    setUser(usuario);
    connectSocket();
  }

  async function login(email, password) {
    const data = await authService.login(email, password);
    persistSession(data);
    return data.usuario;
  }

  async function registerPaciente(payload) {
    const data = await authService.registerPaciente(payload);
    persistSession(data);
    return data.usuario;
  }

  async function registerMedico(payload) {
    // El médico no recibe token: su cuenta queda inactiva hasta que
    // un admin verifique su colegiatura, así que no hay sesión que iniciar.
    const data = await authService.registerMedico(payload);
    return data;
  }

  function setProfile(usuario) {
    localStorage.setItem("user", JSON.stringify(usuario));
    setUser(usuario);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, login, registerPaciente, registerMedico, logout, setProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
