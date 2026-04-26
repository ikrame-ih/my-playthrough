/**
 * Bloque de error homogéneo con botón reintentar (misma piel que el resto de la app).
 */
export default function ErrorRetryPanel({
  title = "No hemos podido cargar el contenido.",
  hint = "Comprueba que el servidor está en marcha o que la conexión es estable.",
  onRetry,
  retryLabel = "Reintentar",
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
