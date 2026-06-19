/**
 * Consistent error block with optional retry button.
 */
export default function ErrorRetryPanel({
  title = "We couldn't load this content.",
  hint = "Check that the server is running and your connection is stable.",
  onRetry,
  retryLabel = "Retry",
  className = "",
}) {
  return (
    <div
      className={`figma-panel px-6 py-12 text-center ${className}`.trim()}
      role="alert"
    >
      <p className="font-medium text-slate-200">{title}</p>
      {hint && (
        <p className="mt-2 text-sm text-slate-500">{hint}</p>
      )}
      {typeof onRetry === "function" && (
        <button
          type="button"
          onClick={onRetry}
          className="figma-btn-primary mt-6"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
