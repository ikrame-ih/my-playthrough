import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api";
import { playRecommendationChime } from "../notificationSound";
import { IconBell } from "./icons";

/**
 * Campana con contador de recomendaciones no leídas (`/api/social/recommendations/unread-count`).
 *
 * Cada ~45 s la app vuelve a preguntar al servidor el número de no leídas
 * (no hay conexión en tiempo real permanente: es una consulta repetida por intervalo).
 * El tono (`playRecommendationChime`) solo suena si:
 * - el usuario tiene `notificaciones_sonido` activo en perfil,
 * - ya hubo al menos una consulta anterior (evita sonido al cargar la página),
 * - el contador sube respecto al valor anterior,
 * - el usuario ha hecho un clic o toque en la página (los navegadores suelen bloquear audio sin gesto previo),
 * - la pestaña está visible (`document.visibilityState === 'visible'`).
 *
 * @param {{ user?: { notificaciones_sonido?: boolean } }} props
 */
export default function NotificationBell({ user }) {
  const soundOn = user?.notificaciones_sonido !== false;
  const [count, setCount] = useState(0);
  const prev = useRef(null);
  const interacted = useRef(false);

  useEffect(() => {
    const onFirst = () => {
      interacted.current = true;
    };
    document.addEventListener("pointerdown", onFirst, { once: true });
    return () => document.removeEventListener("pointerdown", onFirst);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchUnreadCount() {
      try {
        const res = await apiFetch(
          `${API_BASE}/api/social/recommendations/unread-count`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const n = Number(data.count) || 0;
        if (
          prev.current !== null &&
          n > prev.current &&
          soundOn &&
          interacted.current &&
          document.visibilityState === "visible"
        ) {
          playRecommendationChime();
        }
        prev.current = n;
        setCount(n);
      } catch {
        /* ignorar */
      }
    }

    fetchUnreadCount();
    const t = window.setInterval(fetchUnreadCount, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [soundOn]);

  return (
    <Link
      to="/recommendations"
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/[0.06] hover:text-brand-accent"
      aria-label={`Recomendaciones${count > 0 ? `, ${count} sin leer` : ""}`}
      title="Recomendaciones"
    >
      <IconBell className="h-5 w-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand-accent px-1 text-[0.65rem] font-bold text-black">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
