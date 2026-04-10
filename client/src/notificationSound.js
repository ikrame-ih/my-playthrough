/**
 * Genera un pitido muy corto con Web Audio API (oscilador + envolvente de volumen).
 * No depende de ficheros MP3: todo es sintético. Si el contexto de audio falla o el
 * navegador bloquea el sonido, la función termina sin error.
 */
export function playRecommendationChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.frequency.value = 784;
    osc.type = "sine";
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.07, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    osc.start(t);
    osc.stop(t + 0.2);
    osc.onended = () => ctx.close().catch(() => {});
  } catch {
    /* sin audio */
  }
}
