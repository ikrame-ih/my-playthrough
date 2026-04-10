import { useCallback, useEffect, useMemo, useState } from "react";
import Joyride, { STATUS } from "react-joyride";

/** Clave en localStorage: no volver a mostrar el tour hasta que el usuario lo reinicie desde Perfil. */
export const TOUR_STORAGE_KEY = "myplaythrough_tour_v1";

/** Dispara el tour desde cualquier sitio (p. ej. botón en Perfil). */
export function requestWelcomeTour() {
  localStorage.removeItem(TOUR_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("myplaythrough-start-tour"));
}

/**
 * Tour guiado inicial (react-joyride): resalta menú, búsqueda, campana y perfil.
 * Solo se lanza la primera vez; se puede repetir desde Ajustes de perfil.
 *
 * @param {{ isAdmin: boolean }} props - Si es false, se omite el paso del enlace Administración (no existe en el DOM).
 */
export default function WelcomeTour({ isAdmin }) {
  const [run, setRun] = useState(false);

  const steps = useMemo(
    () => [
      {
        target: '[data-tour="tour-welcome"]',
        content:
          "Bienvenida a MyPlaythrough. En unos pasos verás dónde está cada función principal: tu biblioteca, la comunidad, las recomendaciones y más.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="sidebar-nav"]',
        content:
          "Menú lateral: aquí cambias de sección. En pantallas pequeñas ábrelo con el icono ☰ arriba a la izquierda.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-coleccion"]',
        content: "Mi colección: añade juegos, notas y carátulas; cambia entre vista cuadrícula y lista.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-comunidad"]',
        content:
          "Comunidad: miembros, estadísticas, actividad de quien sigues, buscar grupo (LFG) y enlaces a perfiles públicos.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-admin"]',
        content:
          "Administración (solo admins): revisar usuarios, moderar fichas y borrar cuentas si hace falta.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-perfil"]',
        content:
          "Perfil: elige avatar, silencia o activa el tono de nuevas recomendaciones y vuelve a ver este tour cuando quieras.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="header-tools"]',
        content:
          "Barra superior: búsqueda global (Intro para resultados), campana de recomendaciones recibidas y acceso rápido al perfil.",
        placement: "bottom",
        disableBeacon: true,
      },
    ],
    [],
  );

  const filteredSteps = useMemo(() => {
    if (isAdmin) return steps;
    return steps.filter((s) => s.target !== '[data-tour="nav-admin"]');
  }, [isAdmin, steps]);

  useEffect(() => {
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return undefined;
    const t = window.setTimeout(() => setRun(true), 700);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const onStart = () => setRun(true);
    window.addEventListener("myplaythrough-start-tour", onStart);
    return () => window.removeEventListener("myplaythrough-start-tour", onStart);
  }, []);

  const onCallback = useCallback((data) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
      setRun(false);
    }
  }, []);

  return (
    <Joyride
      steps={filteredSteps}
      run={run}
      continuous
      showSkipButton
      scrollToFirstStep
      disableScrollParentFix
      styles={{
        options: {
          primaryColor: "#2dd4bf",
          textColor: "#e2e8f0",
          backgroundColor: "#0f172a",
          overlayColor: "rgba(0, 0, 0, 0.78)",
          arrowColor: "#0f172a",
          zIndex: 10050,
        },
        tooltip: { borderRadius: 12, fontSize: 14 },
        buttonNext: {
          backgroundColor: "#2dd4bf",
          color: "#020617",
          fontWeight: 600,
          borderRadius: 8,
        },
        buttonBack: { color: "#94a3b8" },
        buttonSkip: { color: "#64748b" },
      }}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Listo",
        next: "Siguiente",
        skip: "Saltar tour",
      }}
      callback={onCallback}
    />
  );
}
