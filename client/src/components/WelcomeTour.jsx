import { useCallback, useEffect, useMemo, useState } from "react";
import Joyride, { STATUS } from "react-joyride";

/** localStorage prefix; tour completed / skipped per account (`…_u{id}`). */
export const TOUR_STORAGE_KEY = "myplaythrough_tour_v1";

function tourStorageKeyForUser(userId) {
  return `${TOUR_STORAGE_KEY}_u${String(userId)}`;
}

/** Marks that after a new registration, the tour should show once (until completed or skipped). */
function tourPendingAfterRegisterKey(userId) {
  return `myplaythrough_tour_after_register_u${String(userId)}`;
}

/** Call only after a successful register: the tour does not auto-start on later logins. */
export function markWelcomeTourAfterRegister(userId) {
  if (userId == null) return;
  localStorage.setItem(tourPendingAfterRegisterKey(userId), "1");
}

/** Trigger the tour from anywhere (e.g. Profile button). Pass the current user id. */
export function requestWelcomeTour(userId) {
  if (userId != null) {
    localStorage.removeItem(tourStorageKeyForUser(userId));
    localStorage.removeItem(tourPendingAfterRegisterKey(userId));
  }
  localStorage.removeItem(TOUR_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("myplaythrough-start-tour"));
}

/**
 * Guided tour (react-joyride): menu, search, bell, and profile.
 * Auto-starts only after **registration** for that account in this browser (`markWelcomeTourAfterRegister`).
 * Does not show on normal logins; restart from Profile → "Start guided tour" (`requestWelcomeTour`).
 *
 * @param {{ isAdmin: boolean; userId?: number }} props — If false, the Administration link step is omitted.
 */
export default function WelcomeTour({ isAdmin, userId }) {
  const [run, setRun] = useState(false);

  const steps = useMemo(
    () => [
      {
        target: '[data-tour="tour-welcome"]',
        content:
          "Welcome to MyPlaythrough. In a few steps you'll see where each main feature lives: your library, the community, recommendations, and more.",
        placement: "center",
        disableBeacon: true,
      },
      {
        target: '[data-tour="sidebar-nav"]',
        content:
          "Side menu: switch sections here. On small screens, open it with the ☰ icon at the top left.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-coleccion"]',
        content: "My collection: add games, notes, and cover art; switch between grid and list view.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-comunidad"]',
        content:
          "Community: members, stats, activity from people you follow, find-a-group (LFG), and links to public profiles.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-admin"]',
        content:
          "Administration (admins only): review users, moderate entries, and delete accounts when needed.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="nav-perfil"]',
        content:
          "Profile: pick an avatar, mute or enable the new-recommendation chime, and replay this tour anytime.",
        placement: "right",
        disableBeacon: true,
      },
      {
        target: '[data-tour="header-tools"]',
        content:
          "Top bar: global search (Enter for results), recommendation bell, and quick access to your profile.",
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
    if (userId == null) return undefined;
    const doneKey = tourStorageKeyForUser(userId);
    if (localStorage.getItem(doneKey)) return undefined;
    const pendingKey = tourPendingAfterRegisterKey(userId);
    if (localStorage.getItem(pendingKey) !== "1") return undefined;
    const t = window.setTimeout(() => setRun(true), 700);
    return () => window.clearTimeout(t);
  }, [userId]);

  useEffect(() => {
    const onStart = () => setRun(true);
    window.addEventListener("myplaythrough-start-tour", onStart);
    return () => window.removeEventListener("myplaythrough-start-tour", onStart);
  }, []);

  const onCallback = useCallback(
    (data) => {
      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) {
        if (userId != null) {
          localStorage.setItem(tourStorageKeyForUser(userId), "1");
          localStorage.removeItem(tourPendingAfterRegisterKey(userId));
        }
        setRun(false);
      }
    },
    [userId],
  );

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
        back: "Back",
        close: "Close",
        last: "Done",
        next: "Next",
        skip: "Skip tour",
      }}
      callback={onCallback}
    />
  );
}
