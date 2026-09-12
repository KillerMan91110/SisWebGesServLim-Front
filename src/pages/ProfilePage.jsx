import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { changePassword, updateProfile } from "../services/authService";

export function ProfilePage() {
  const { user, setProfile } = useAuth();
  const [form, setForm] = useState({
    nombre: user.nombre ?? "",
    telefono: user.telefono ?? "",
  });
  const [profileError, setProfileError] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    passwordActual: "",
    passwordNueva: "",
    confirmarPassword: "",
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  async function handleProfileSubmit(e) {
    e.preventDefault();
    setProfileError(null);
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const usuario = await updateProfile(form);
      setProfile(usuario);
      setProfileSaved(true);
    } catch (err) {
      setProfileError(err.response?.data?.error ?? "No se pudo actualizar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (passwordForm.passwordNueva !== passwordForm.confirmarPassword) {
      setPasswordError("La confirmación no coincide con la contraseña nueva.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(passwordForm);
      setPasswordSaved(true);
      setPasswordForm({ passwordActual: "", passwordNueva: "", confirmarPassword: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.error ?? "No se pudo cambiar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="dashboard">
      <section className="panel">
        <h2>Mi perfil</h2>
        {profileError && <p className="form-error">{profileError}</p>}
        {profileSaved && <p>Perfil actualizado correctamente.</p>}
        <form className="request-form" onSubmit={handleProfileSubmit}>
          <label>
            Nombre completo
            <input
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </label>
          <label>
            Teléfono
            <input
              value={form.telefono}
              onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
            />
          </label>
          <p className="form-hint">Correo: {user.email} (no editable)</p>
          <button type="submit" disabled={savingProfile}>
            {savingProfile ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Cambiar contraseña</h2>
        {passwordError && <p className="form-error">{passwordError}</p>}
        {passwordSaved && <p>Contraseña actualizada correctamente.</p>}
        <form className="request-form" onSubmit={handlePasswordSubmit}>
          <label>
            Contraseña actual
            <input
              type="password"
              value={passwordForm.passwordActual}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, passwordActual: e.target.value }))
              }
              required
            />
          </label>
          <label>
            Contraseña nueva
            <input
              type="password"
              value={passwordForm.passwordNueva}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, passwordNueva: e.target.value }))
              }
              required
              minLength={8}
            />
          </label>
          <label>
            Confirmar contraseña nueva
            <input
              type="password"
              value={passwordForm.confirmarPassword}
              onChange={(e) =>
                setPasswordForm((prev) => ({ ...prev, confirmarPassword: e.target.value }))
              }
              required
              minLength={8}
            />
          </label>
          <button type="submit" disabled={savingPassword}>
            {savingPassword ? "Guardando..." : "Cambiar contraseña"}
          </button>
        </form>
      </section>
    </div>
  );
}
