import { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Footer } from "./Footer";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/login");
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <div className="topbar">
        <div className="topbar-inner">
          <span>🕒 Atención todos los días · 7:00 a. m. – 10:00 p. m.</span>
          <span className="topbar-right">
            <span>📍 Puente Piedra, Lima</span>
            <span className="topbar-emergency">🚑 Emergencias: llama al 106 (SAMU)</span>
          </span>
        </div>
      </div>
      <header className="navbar">
        <div className="navbar-brand-group">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="navbar-logo-badge" aria-hidden="true">✚</span>
            <span className="navbar-brand-text">
              MedGo
              <small>Centro médico digital</small>
            </span>
          </Link>
          {user && (
            <Link to="/perfil" className="navbar-user" onClick={closeMenu}>
              {user.nombre}
            </Link>
          )}
        </div>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
        >
          ☰
        </button>

        <nav className={`navbar-links ${menuOpen ? "is-open" : ""}`}>
          {!user && (
            <>
              <Link to="/nosotros" onClick={closeMenu}>
                Quiénes somos
              </Link>
              <Link to="/personal" onClick={closeMenu}>
                Personal
              </Link>
              <Link to="/contacto" onClick={closeMenu}>
                Contáctanos
              </Link>
            </>
          )}
          {user?.rol === "paciente" && (
            <>
              <Link to="/paciente" onClick={closeMenu}>
                Mi panel
              </Link>
              <Link to="/paciente/ficha" onClick={closeMenu}>
                Mi ficha clínica
              </Link>
            </>
          )}
          {user?.rol === "medico" && (
            <Link to="/medico" onClick={closeMenu}>
              Mi panel
            </Link>
          )}
          {user?.rol === "admin" && (
            <Link to="/admin" onClick={closeMenu}>
              Administración
            </Link>
          )}
          {user && (
            <button className="link-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          )}
          {!user && (
            <>
              <Link to="/login" onClick={closeMenu}>
                Ingresar
              </Link>
              <Link to="/register" className="navbar-cta" onClick={closeMenu}>
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </header>
      <main id="contenido" className="app-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
