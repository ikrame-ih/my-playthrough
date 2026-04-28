import { useEffect, useRef, useState } from "react";
import { API_BASE, apiFetch } from "../api";

/**
 * Modal para enviar una recomendación (juego de tu colección → usuario al que sigues).
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {{ id: number, titulo: string } | null} props.preselectedGame — desde tu colección
 * @param {number | null} props.fixedRecipientId — perfil público
 * @param {string} [props.fixedRecipientName]
 * @param {(detail?: { recipientName: string; gameTitle: string }) => void} [props.onSent]
 */
export default function RecommendGameModal({
  open,
  onClose,
  preselectedGame = null,
  fixedRecipientId = null,
  fixedRecipientName = "",
  onSent,
}) {
  const [following, setFollowing] = useState([]);
  const [myGames, setMyGames] = useState([]);
  const [recipientId, setRecipientId] = useState("");
  const [gameId, setGameId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadLists, setLoadLists] = useState(false);
  /** Tras POST correcto: texto de confirmación para quien envía la recomendación. */
  const [sendConfirmation, setSendConfirmation] = useState(null);
  /** Evita vaciar el texto del mensaje si el id del juego cambia de tipo o se actualiza con el modal ya abierto. */
  const prevOpenRef = useRef(false);

  const stablePreId =
    preselectedGame?.id != null &&
    !Number.isNaN(Number(preselectedGame.id))
      ? String(Number(preselectedGame.id))
      : null;

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    if (!prevOpenRef.current) {
      setErr("");
      setMensaje("");
      setSendConfirmation(null);
      prevOpenRef.current = true;
    }
    setRecipientId(fixedRecipientId != null ? String(fixedRecipientId) : "");
    setGameId(stablePreId != null ? String(stablePreId) : "");
    let cancelled = false;
    async function load() {
      setLoadLists(true);
      try {
        if (fixedRecipientId != null) {
          const gr = await apiFetch(`${API_BASE}/api/games`);
          if (gr.ok && !cancelled) {
            setMyGames(await gr.json());
          }
        } else {
          const fr = await apiFetch(`${API_BASE}/api/social/following`);
          if (fr.ok && !cancelled) {
            setFollowing(await fr.json());
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoadLists(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, fixedRecipientId, stablePreId]);

  if (!open) return null;

  const handleClose = () => {
    setSendConfirmation(null);
    onClose();
  };

  const recipientLabelFor = (dest) =>
    fixedRecipientId != null
      ? fixedRecipientName || `Usuario #${fixedRecipientId}`
      : following.find((u) => Number(u.id) === dest)?.nombre_usuario ||
        `Usuario #${dest}`;

  const gameTitleFor = (juego) =>
    preselectedGame?.titulo ??
    myGames.find((g) => Number(g.id) === Number(juego))?.titulo ??
    "este juego";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const dest = parseInt(recipientId, 10);
    const juego = parseInt(gameId, 10);
    if (!Number.isFinite(dest) || !Number.isFinite(juego)) {
      setErr("Elige destinatario y juego.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/social/recommendations`, {
        method: "POST",
        body: JSON.stringify({
          destinatario_id: dest,
          juego_id: juego,
          mensaje: mensaje.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error || "No se pudo enviar.");
        return;
      }
      const detail = {
        recipientName: recipientLabelFor(dest),
        gameTitle: gameTitleFor(juego),
      };
      setSendConfirmation(detail);
      onSent?.(detail);
    } catch {
      setErr("Error de conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reco-modal-title"
      onClick={handleClose}
    >
      <div
        className="figma-panel max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="reco-modal-title"
          className="text-lg font-bold tracking-tight text-white"
        >
          {sendConfirmation ? "Listo" : "Recomendar juego"}
        </h2>
        {!sendConfirmation && (
          <p className="mt-2 text-sm text-slate-400">
            Solo puedes recomendar títulos de tu biblioteca a personas que
            sigues.
          </p>
        )}

        {sendConfirmation ? (
          <div className="mt-6 space-y-5">
            <div
              className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 px-4 py-3.5 text-sm text-emerald-100/95 shadow-[inset_0_1px_0_0_rgba(52,211,153,0.08)]"
              role="status"
              aria-live="polite"
            >
              <p className="font-semibold text-emerald-50">
                Recomendación enviada
              </p>
              <p className="mt-2 leading-relaxed">
                Has recomendado{" "}
                <span className="font-semibold text-white">
                  «{sendConfirmation.gameTitle}»
                </span>{" "}
                a{" "}
                <span className="font-semibold text-white">
                  {sendConfirmation.recipientName}
                </span>
                . Podrá verlo en su bandeja de recomendaciones (icono de campana).
              </p>
            </div>
            <button
              type="button"
              className="figma-btn-primary w-full py-3"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </div>
        ) : (
        <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
          {fixedRecipientId != null ? (
            <div>
              <p className="text-sm font-medium text-slate-300">Para</p>
              <p className="mt-1 text-sm text-white">
                {fixedRecipientName || `Usuario #${fixedRecipientId}`}
              </p>
            </div>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-400">
                Destinatario
              </span>
              <select
                className="figma-input py-3 text-sm"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                disabled={loadLists}
                required
              >
                <option value="">— Elige a quién —</option>
                {following.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre_usuario}
                  </option>
                ))}
              </select>
              {following.length === 0 && !loadLists && (
                <span className="text-xs text-amber-400/90">
                  Aún no sigues a nadie. Abre un perfil y pulsa «Seguir».
                </span>
              )}
            </label>
          )}

          {preselectedGame ? (
            <div>
              <p className="text-sm font-medium text-slate-300">Juego</p>
              <p className="mt-1 text-sm text-white">{preselectedGame.titulo}</p>
            </div>
          ) : (
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-400">
                Tu juego
              </span>
              <select
                className="figma-input py-3 text-sm"
                value={gameId}
                onChange={(e) => setGameId(e.target.value)}
                disabled={loadLists}
                required
              >
                <option value="">— Elige de tu colección —</option>
                {myGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.titulo}
                  </option>
                ))}
              </select>
              {myGames.length === 0 && !loadLists && (
                <span className="text-xs text-slate-500">
                  Añade juegos a tu colección primero.
                </span>
              )}
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-400">
              Mensaje (opcional)
            </span>
            <textarea
              className="figma-input min-h-[88px] py-3 text-sm"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              maxLength={500}
              placeholder="¿Por qué te gustaría que lo probase?"
            />
          </label>

          {err && (
            <p className="text-sm text-red-400" role="alert">
              {err}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="button"
              className="figma-btn-outline !w-auto px-4 py-2.5"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="figma-btn-primary !w-auto px-5"
              disabled={loading || loadLists}
            >
              {loading ? "Enviando…" : "Enviar"}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
