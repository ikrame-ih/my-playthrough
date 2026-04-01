import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import { IconController } from "./icons";

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

  useEffect(() => {
    const saved = localStorage.getItem("rememberEmail");
    if (saved) {
      setFormData((f) => ({ ...f, email: saved }));
      setRemember(true);
    }
  }, []);

  const handleChange = (e) => {
    setFormError("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setLoading(true);

    const endpoint =
      mode === "register"
        ? `${API_BASE}/api/auth/register`
        : `${API_BASE}/api/auth/login`;

    try {
      const email = formData.email.trim().toLowerCase();
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register"
            ? { ...formData, email }
            : { email, password: formData.password },
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
          localStorage.setItem("rememberEmail", email);
        } else {
          localStorage.removeItem("rememberEmail");
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-bg bg-app-radial px-4 py-12">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-brand-accent ring-1 ring-white/[0.08]">
          <IconController className="h-7 w-7" />
        </span>
        <h1 className="mt-5 max-w-sm text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">
          {mode === "login"
            ? "Inicia sesión en tu cuenta"
            : "Crea una cuenta nueva"}
        </h1>
      </div>

      <div className="figma-panel w-full max-w-md p-8 sm:p-10">
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
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
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
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              className="figma-input"
            />
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
  );
}
