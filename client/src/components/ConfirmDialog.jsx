/**
 * Accessible confirmation dialog for destructive actions.
 */
export default function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      onClick={onCancel}
    >
      <div
        className="figma-panel w-full max-w-md border border-white/10 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-bold tracking-tight text-white"
        >
          {title}
        </h2>
        {message && (
          <p className="mt-3 text-sm leading-relaxed text-slate-300">{message}</p>
        )}
        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="figma-btn-outline w-full py-3 sm:!w-auto sm:px-5"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="w-full rounded-lg border border-red-500/45 bg-red-950/60 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-900/55 disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
