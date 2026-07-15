import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { ROBOT_AVATAR_IDS } from "../constants/avatars";
import UserAvatar from "./UserAvatar";
import { requestWelcomeTour } from "./WelcomeTour";

// Profile: display name, avatar, notification sound, tour replay. PATCH /api/auth/me + localStorage sync.
export default function ProfileSettings({ user, onUserUpdate }) {
  const [saving, setSaving] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingSound, setSavingSound] = useState(false);
  const [err, setErr] = useState("");
  const [nameSavedMsg, setNameSavedMsg] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const current = user?.avatar_id || "robot-0";
  const soundOn = user?.notificaciones_sonido !== false;

  useEffect(() => {
    setNameDraft((user?.nombre_usuario ?? "").trim());
  }, [user?.nombre_usuario]);

  useEffect(() => {
    if (!nameSavedMsg) return;
    const t = setTimeout(() => setNameSavedMsg(""), 5000);
    return () => clearTimeout(t);
  }, [nameSavedMsg]);

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
            "Could not save.",
        );
        return;
      }
      if (data.user) {
        onUserUpdate(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      setErr("Connection error.");
    } finally {
      setSaving(false);
    }
  };

  const saveDisplayName = async () => {
    if (savingName || !user?.id) return;
    const next = String(nameDraft ?? "").trim();
    if (!next) {
      setErr("Name cannot be empty.");
      setNameSavedMsg("");
      return;
    }
    if (next === (user.nombre_usuario || "").trim()) {
      setErr("");
      setNameSavedMsg("");
      return;
    }
    setErr("");
    setNameSavedMsg("");
    setSavingName(true);
    try {
      const payload = { nombre_usuario: next };
      const body = JSON.stringify(payload);
      if (!body.includes('"nombre_usuario"')) {
        setErr("Could not send the name. Reload the page and try again.");
        setNameSavedMsg("");
        setSavingName(false);
        return;
      }
      const res = await apiFetch(`${API_BASE}/api/auth/me`, {
        method: "PATCH",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "Could not save the name.");
        setNameSavedMsg("");
        return;
      }
      if (data.user) {
        onUserUpdate(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setNameSavedMsg("Name saved successfully.");
      }
    } catch {
      setErr("Connection error.");
      setNameSavedMsg("");
    } finally {
      setSavingName(false);
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
        setErr(data.error || "Could not save sound preference.");
        return;
      }
      if (data.user) {
        onUserUpdate(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch {
      setErr("Connection error.");
    } finally {
      setSavingSound(false);
    }
  };

  const nameDirty =
    String(nameDraft ?? "").trim() !== (user?.nombre_usuario || "").trim();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent to-brand-accent/40" />
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Your profile
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400">
            Display name, avatar, and preferences. We use your email for the account; you don't need
            to touch the database to change how you appear in the community.
          </p>
        </div>
        <Link
          to="/"
          className="text-sm font-medium text-brand-accent transition hover:text-teal-300"
        >
          ← Back
        </Link>
      </div>

      <div className="figma-panel relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-brand-accent/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 sm:items-start">
            <div className="rounded-2xl bg-slate-950/40 p-2 ring-1 ring-brand-accent/25">
              <UserAvatar avatarId={current} size="xl" title="Your current avatar" />
            </div>
            <p className="max-w-[9rem] text-center text-xs leading-snug text-slate-500 sm:text-left">
              Used in the menu, community, and comments
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <div>
              <label
                htmlFor="profile-display-name"
                className="text-xs font-semibold uppercase tracking-wider text-brand-accent/90"
              >
                Display name
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <input
                  id="profile-display-name"
                  type="text"
                  autoComplete="username"
                  maxLength={64}
                  value={nameDraft}
                  onChange={(e) => {
                    setNameSavedMsg("");
                    setErr("");
                    setNameDraft(e.target.value);
                  }}
                  className="figma-input min-h-[44px] flex-1 py-2.5 text-sm text-white"
                  placeholder="Your name in the app"
                />
                <button
                  type="button"
                  disabled={savingName || !nameDirty}
                  onClick={() => void saveDisplayName()}
                  className="figma-btn-primary shrink-0 px-4 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingName ? "Saving…" : "Save name"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Must be unique across accounts: if another user already has that name, you'll see a notice and need to pick another.
              </p>
              {nameSavedMsg ? (
                <p className="mt-2 text-sm text-emerald-400" role="status">
                  {nameSavedMsg}
                </p>
              ) : null}
            </div>

            <div className="border-t border-white/[0.06] pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Email address
              </p>
              <p className="mt-2 break-all font-mono text-sm font-medium text-slate-200">
                {user?.email || "—"}
              </p>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-6 sm:gap-4">
              <Link
                to={`/user/${user?.id}`}
                className="w-fit text-sm font-semibold text-brand-accent transition hover:text-teal-300"
              >
                View your public profile
              </Link>
              {user?.rol === "admin" && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-amber-200">
                    Admin
                  </span>
                  <span className="text-xs text-slate-500">
                    Your account can use the Administration panel in the menu.
                  </span>
                </div>
              )}
            </div>

            {err && (
              <p className="text-sm text-red-400" role="alert">
                {err}
              </p>
            )}
          </div>
        </div>
      </div>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Sound for new recommendations
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          A brief chime when a new recommendation arrives (only with the tab
          visible and after you've clicked on the page; browsers limit
          autoplay audio).
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
            ? "Saving…"
            : soundOn
              ? "Sound on — click to mute"
              : "Sound off — click to enable"}
        </button>
      </section>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Guided tour
        </h2>
        <p className="mb-4 text-sm text-slate-400">
          Replay the initial interface walkthrough (menu, search,
          recommendations…).
        </p>
        <button
          type="button"
          onClick={() => requestWelcomeTour(user?.id)}
          className="rounded-lg border border-white/15 bg-brand-input px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-brand-accent/35 hover:text-white"
        >
          Start guided tour
        </button>
      </section>

      <section className="figma-panel p-6 sm:p-8">
        <h2 className="mb-4 text-lg font-semibold text-white">
          Available robots
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
                  aria-label={`Avatar ${id}${selected ? ", selected" : ""}`}
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
