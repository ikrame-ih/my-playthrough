import { useEffect, useRef, useState } from "react";
import { API_BASE, apiFetch } from "../api";

// Send a library game to someone you follow.
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
  const [sendConfirmation, setSendConfirmation] = useState(null);
  const prevOpenRef = useRef(false);

  const stablePreId =
    preselectedGame?.id != null && !Number.isNaN(Number(preselectedGame.id))
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
      ? fixedRecipientName || `User #${fixedRecipientId}`
      : following.find((u) => Number(u.id) === dest)?.nombre_usuario ||
        `User #${dest}`;

  const gameTitleFor = (juego) =>
    preselectedGame?.titulo ??
    myGames.find((g) => Number(g.id) === Number(juego))?.titulo ??
    "this game";

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const dest = parseInt(recipientId, 10);
    const juego = parseInt(gameId, 10);
    if (!Number.isFinite(dest) || !Number.isFinite(juego)) {
      setErr("Choose a recipient and a game.");
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
        setErr(data.error || "Could not send.");
        return;
      }
      const detail = {
        recipientName: recipientLabelFor(dest),
        gameTitle: gameTitleFor(juego),
      };
      setSendConfirmation(detail);
      onSent?.(detail);
    } catch {
      setErr("Connection error.");
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
          {sendConfirmation ? "Done" : "Recommend game"}
        </h2>
        {!sendConfirmation && (
          <p className="mt-2 text-sm text-slate-400">
            You can only recommend titles from your library to people you
            follow.
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
                Recommendation sent
              </p>
              <p className="mt-2 leading-relaxed">
                You recommended{" "}
                <span className="font-semibold text-white">
                  «{sendConfirmation.gameTitle}»
                </span>{" "}
                to{" "}
                <span className="font-semibold text-white">
                  {sendConfirmation.recipientName}
                </span>
                . They can see it in their recommendations inbox (bell
                icon).
              </p>
            </div>
            <button
              type="button"
              className="figma-btn-primary w-full py-3"
              onClick={handleClose}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            {fixedRecipientId != null ? (
              <div>
                <p className="text-sm font-medium text-slate-300">To</p>
                <p className="mt-1 text-sm text-white">
                  {fixedRecipientName || `User #${fixedRecipientId}`}
                </p>
              </div>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-400">
                  Recipient
                </span>
                <select
                  className="figma-input py-3 text-sm"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  disabled={loadLists}
                  required
                >
                  <option value="">— Choose someone —</option>
                  {following.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nombre_usuario}
                    </option>
                  ))}
                </select>
                {following.length === 0 && !loadLists && (
                  <span className="text-xs text-amber-400/90">
                    You're not following anyone yet. Open a profile and click Follow.
                  </span>
                )}
              </label>
            )}

            {preselectedGame ? (
              <div>
                <p className="text-sm font-medium text-slate-300">Game</p>
                <p className="mt-1 text-sm text-white">
                  {preselectedGame.titulo}
                </p>
              </div>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-400">
                  Your game
                </span>
                <select
                  className="figma-input py-3 text-sm"
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  disabled={loadLists}
                  required
                >
                  <option value="">— Choose from your collection —</option>
                  {myGames.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.titulo}
                    </option>
                  ))}
                </select>
                {myGames.length === 0 && !loadLists && (
                  <span className="text-xs text-slate-500">
                    Add games to your collection first.
                  </span>
                )}
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-400">
                Message (optional)
              </span>
              <textarea
                className="figma-input min-h-[88px] py-3 text-sm"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                maxLength={500}
                placeholder="Why would you like them to try it?"
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
                Cancel
              </button>
              <button
                type="submit"
                className="figma-btn-primary !w-auto px-5"
                disabled={loading || loadLists}
              >
                {loading ? "Sending…" : "Send"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
