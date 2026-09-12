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
      <header className="navbar">
        <div className="navbar-brand-group">
          <Link to="/" className="navbar-brand" onClick={closeMenu}>
            <span className="navbar-logo-badge">✚</span>
            MedGo
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
            <Link to="/paciente" onClick={closeMenu}>
              Mi panel
            </Link>
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
            <Link to="/login" onClick={closeMenu}>
              Ingresar
            </Link>
          )}
        </nav>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
