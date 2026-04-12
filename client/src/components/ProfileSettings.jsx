import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { ROBOT_AVATAR_IDS } from "../constants/avatars";
import UserAvatar from "./UserAvatar";
import { requestWelcomeTour } from "./WelcomeTour";

/**
 * Ajustes de perfil: avatar (`avatar_id`), tono de nuevas recomendaciones
 * (`notificaciones_sonido`) y repetición del tour guiado. Todo persiste vía
 * `PATCH /api/auth/me` y actualiza `localStorage` para mantener coherencia con el resto de la app.
 *
 * @param {{ user: object; onUserUpdate: (u: object) => void }} props
 */
export default function ProfileSettings({ user, onUserUpdate }) {
  const [saving, setSaving] = useState(false);
  const [savingSound, setSavingSound] = useState(false);
  const [err, setErr] = useState("");
  const current = user?.avatar_id || "robot-0";
  const soundOn = user?.notificaciones_sonido !== false;

  const pick = async (avatar_id) => {
    if (saving || avatar_id === current) return;
    setErr("");
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        body: JSON.stringify({ avatar_id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(
          data.error ||
            data.detail ||
            "No se pudo guardar.",
        );
        return;
      }
      if (data.user) {
        onUserUpdate(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      setErr("Error de conexión.");
    } finally {
      setSaving(false);
    }
  };

  const toggleSound = async () => {
    if (savingSound) return;
    setErr("");
    setSavingSound(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        body: JSON.stringify({ notificaciones_sonido: !soundOn }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "No se pudo guardar la preferencia de sonido.");
        return;
      }
      if (data.user) {
        onUserUpdate(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      setErr("Error de conexión.");
    } finally {
      setSavingSound(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/40" />
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Perfil y avatar
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Elige uno de los robots predefinidos. Se mostrará en la barra superior,
            en la comunidad, en tu perfil público y junto a tus comentarios.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-brand-accent transition hover:text-teal-300"
        >
          ← Volver
        </Link>
      </div>

      <div className="figma-panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <UserAvatar avatarId={current} size="xl" title="Tu avatar actual" />
          <p className="text-center text-xs text-slate-500 sm:text-left">
            Vista previa
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-300">
            {user?.nombre_usuario}
          </p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
          {err && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {err}
            </p>
          )}
        </div>
      </div>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Sonido al recibir recomendaciones
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Un tono breve cuando llega una recomendación nueva (solo con la pestaña
          visible y tras haber pulsado en la página; los navegadores limitan el
          audio automático).
        </p>
        <button
          type="button"
          disabled={savingSound}
          onClick={toggleSound}
          className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${
            soundOn
              ? "border-brand-accent/40 bg-brand-accent/10 text-brand-accent"
              : "border-white/10 bg-brand-input text-slate-300 hover:border-white/20"
          } disabled:opacity-60`}
        >
          {savingSound
            ? "Guardando…"
            : soundOn
              ? "Sonido activado — pulsar para silenciar"
              : "Sonido desactivado — pulsar para activar"}
        </button>
      </section>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Tour guiado
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Vuelve a ver la presentación inicial de la interfaz (menú, búsqueda,
          recomendaciones…).
        </p>
        <button
          type="button"
          onClick={() => requestWelcomeTour(user?.id)}
          className="rounded-lg border border-white/15 bg-brand-input px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-brand-accent/35 hover:text-white"
        >
          Iniciar tour guiado
        </button>
      </section>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Robots disponibles
        </h2>
        <ul className="motion-stagger grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {ROBOT_AVATAR_IDS.map((id) => {
            const selected = id === current;
            return (
              <li key={id}>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => pick(id)}
                  className={`motion-avatar-tile flex w-full flex-col items-center gap-2 rounded-xl border p-3 ${
                    selected
                      ? "border-brand-accent/60 bg-brand-accent/10 shadow-inner"
                      : "border-white/[0.08] bg-slate-900/30 hover:border-brand-accent/35 hover:bg-slate-900/50"
                  } disabled:cursor-wait disabled:opacity-60`}
                  aria-pressed={selected}
                  aria-label={`Avatar ${id}${selected ? ", seleccionado" : ""}`}
                >
                  <UserAvatar avatarId={id} size="lg" />
                  <span className="text-[0.65rem] font-mono text-slate-500">
                    {id}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
