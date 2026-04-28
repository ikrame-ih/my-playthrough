import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import { passwordPolicyMessage } from "../passwordPolicy";
import { IconController, IconEye, IconEyeOff } from "./icons";
import RobotAvatar from "./RobotAvatar";

/**
 * Pantalla de autenticación que combina login y registro en un único componente.
 * El estado `mode` controla cuál de los dos formularios se muestra.
 * Al completar la autenticación con éxito, guarda el token en localStorage
 * y notifica al componente padre mediante `onAuthSuccess`.
 *
 * @component
 * @param {object}   props
 * @param {Function} props.onAuthSuccess - Callback que recibe el objeto `user` tras autenticarse.
 */
export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    nombre_usuario: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("rememberLogin");
    if (saved) {
      setFormData((f) => ({ ...f, email: saved }));
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    const t =
      mode === "login" ? "Iniciar sesión" : "Crear cuenta";
    document.title = `${t} · MyPlaythrough`;
  }, [mode]);

  const handleChange = (e) => {
    setFormError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (mode === "register") {
      const pwdErr = passwordPolicyMessage(formData.password);
      if (pwdErr) {
        setFormError(pwdErr);
        return;
      }
    }
    setLoading(true);

    const endpoint =
      mode === "register"
        ? `${API_BASE}/api/auth/register`
        : `${API_BASE}/api/auth/login`;

    try {
      const emailNorm = formData.email.trim().toLowerCase();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { ...formData, email: emailNorm }
            : {
                login: formData.email.trim(),
                password: formData.password,
              },
        ),
      });

      let data = {};
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch {
        setFormError(
          "Respuesta del servidor no válida. ¿Está arrancado el backend en el puerto 3000?",
        );
        return;
      }

      if (!response.ok) {
        const parts = [data.error, data.detail].filter(Boolean);
        setFormError(
          parts.length > 0
            ? parts.join(" — ")
            : `Error ${response.status}: no se pudo completar la autenticación.`,
        );
        return;
      }

      if (!data.token || !data.user) {
        setFormError("Respuesta incompleta del servidor.");
        return;
      }

      if (mode === "login") {
        if (remember) {
          localStorage.setItem("rememberLogin", formData.email.trim());
        } else {
          localStorage.removeItem("rememberLogin");
        }
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      onAuthSuccess(data.user);
    } catch {
      setFormError(
        "No hay conexión con el servidor. Abre una terminal en la carpeta server y ejecuta: npm run dev",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-brand-bg bg-app-radial py-12">
      <div className="auth-aurora" aria-hidden="true" />
      <div className="relative z-10 flex w-full flex-col items-center px-4">
        <div className="mb-8 flex flex-col items-center text-center">
        <span className="auth-logo-float flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/90 text-brand-accent shadow-[0_0_32px_-6px_rgba(45,212,191,0.45)] ring-1 ring-brand-accent/35">
          <IconController className="h-7 w-7" />
        </span>
        <h1 className="mt-5 max-w-sm text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-[1.65rem]">
          {mode === "login"
            ? "Inicia sesión en tu cuenta"
            : "Crea una cuenta nueva"}
        </h1>
        <div className="auth-avatar-bounce mt-6" aria-hidden="true">
          {["robot-0", "robot-2", "robot-4", "robot-5", "robot-7"].map(
            (id) => (
              <span key={id} className="auth-avatar-bounce__item">
                <RobotAvatar robotId={id} className="h-12 w-12 sm:h-14 sm:w-14" />
              </span>
            ),
          )}
        </div>
        </div>

        <div className="figma-panel w-full max-w-md p-8 shadow-glow-sm ring-1 ring-brand-accent/16 sm:p-10 motion-safe:animate-page-in">
        {formError && (
          <div
            className="mb-5 rounded-lg border border-red-500/35 bg-red-950/35 px-4 py-3 text-sm text-red-100"
            role="alert"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {mode === "register" && (
            <div>
              <label
                htmlFor="nombre_usuario"
                className="mb-1.5 block text-sm font-medium text-slate-400"
              >
                Nombre de usuario
              </label>
              <input
                id="nombre_usuario"
                type="text"
                name="nombre_usuario"
                placeholder="Tu nombre público"
                value={formData.nombre_usuario}
                onChange={handleChange}
                required
                autoComplete="username"
                className="figma-input"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              {mode === "login"
                ? "Email o nombre de usuario"
                : "Correo electrónico"}
            </label>
            <input
              id="email"
              type={mode === "login" ? "text" : "email"}
              name="email"
              placeholder={
                mode === "login"
                  ? "tu@email.com o nombre de usuario"
                  : "tu@email.com"
              }
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete={mode === "login" ? "username" : "email"}
              className="figma-input"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium text-slate-400"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                className="figma-input pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/40"
              >
                {showPassword ? (
                  <IconEyeOff className="h-5 w-5" />
                ) : (
                  <IconEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {mode === "register" && (
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                Mínimo 8 caracteres, con mayúscula, minúscula, número y un símbolo
                (por ejemplo <span className="font-mono text-slate-400">!</span>{" "}
                o <span className="font-mono text-slate-400">?</span>).
              </p>
            )}
          </div>

          {mode === "login" && (
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-brand-input text-brand-accent focus:ring-brand-accent/40"
              />
              Recordarme
            </label>
          )}

          {mode === "login" && (
            <p className="text-center text-xs text-slate-500">
              <button
                type="button"
                className="font-medium text-brand-accent underline decoration-brand-accent/40 underline-offset-2 transition hover:text-teal-300"
                onClick={() =>
                  setFormData((f) => ({
                    ...f,
                    email: "Demo Jurado",
                    password: "Presentacion2026!",
                  }))
                }
              >
                Rellenar cuenta demo
              </button>
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="figma-btn-primary mt-1 w-full py-3.5 disabled:opacity-60"
          >
            {loading
              ? "Procesando..."
              : mode === "login"
                ? "Iniciar sesión"
                : "Crear cuenta"}
          </button>
        </form>

        <div className="relative my-8">
          <div className="border-t border-white/10" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-brand-panel px-3 text-xs text-slate-500">
            {mode === "login"
              ? "¿No tienes cuenta?"
              : "¿Ya tienes cuenta?"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setShowPassword(false);
            setMode(mode === "login" ? "register" : "login");
          }}
          className="figma-btn-outline"
        >
          {mode === "login"
            ? "Crear una cuenta nueva"
            : "Iniciar sesión"}
        </button>
        </div>
      </div>
    </div>
  );
}
