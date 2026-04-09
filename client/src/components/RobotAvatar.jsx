/**
 * Ilustraciones SVG de robots (paleta alineada con brand: teal sobre fondo oscuro).
 * Cada variante es geométrica y ligera para escalar bien en listas y cabeceras.
 */

import { coerceAvatarId } from "../constants/avatars";

const A = "#2DD4BF";
const S = "#334155";
const D = "#0F172A";
const M = "#64748B";
const L = "#94A3B8";

/**
 * @param {{ robotId: string; className?: string; title?: string }} props
 */
export default function RobotAvatar({ robotId, className = "", title }) {
  const id = coerceAvatarId(robotId);

  const inner = (() => {
    switch (id) {
      case "robot-0":
        return (
          <>
            <circle cx="24" cy="26" r="14" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="19" cy="24" r="2.5" fill={D} />
            <circle cx="29" cy="24" r="2.5" fill={D} />
            <path
              d="M18 31 Q24 35 30 31"
              fill="none"
              stroke={A}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <line x1="24" y1="12" x2="24" y2="8" stroke={A} strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="7" r="2" fill={A} />
          </>
        );
      case "robot-1":
        return (
          <>
            <rect x="10" y="14" width="28" height="24" rx="4" fill={S} stroke={A} strokeWidth="1.5" />
            <rect x="13" y="20" width="22" height="8" rx="2" fill={D} />
            <rect x="16" y="22" width="6" height="4" rx="1" fill={A} />
            <rect x="26" y="22" width="6" height="4" rx="1" fill={A} />
            <rect x="18" y="34" width="12" height="2" rx="1" fill={M} />
          </>
        );
      case "robot-2":
        return (
          <>
            <ellipse cx="24" cy="26" rx="15" ry="13" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="24" cy="26" r="6" fill={D} stroke={A} strokeWidth="1.2" />
            <circle cx="24" cy="26" r="2.5" fill={A} />
            <path d="M24 10v-4M18 12l-3-3M30 12l3-3" stroke={A} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case "robot-3":
        return (
          <>
            <rect x="14" y="12" width="20" height="30" rx="5" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="24" cy="20" r="2.5" fill={A} />
            <circle cx="24" cy="28" r="2.5" fill={L} />
            <circle cx="24" cy="36" r="2.5" fill={M} />
            <rect x="19" y="8" width="10" height="3" rx="1" fill={A} />
          </>
        );
      case "robot-4":
        return (
          <>
            <path
              d="M24 10 L34 18 L31 32 H17 L14 18 Z"
              fill={S}
              stroke={A}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <rect x="18" y="20" width="5" height="5" rx="1" fill={D} />
            <rect x="25" y="20" width="5" height="5" rx="1" fill={D} />
            <line x1="20" y1="30" x2="28" y2="30" stroke={A} strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case "robot-5":
        return (
          <>
            <path
              d="M14 22 Q10 12 16 10 L20 14 M34 22 Q38 12 32 10 L28 14"
              fill="none"
              stroke={A}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect x="12" y="18" width="24" height="22" rx="8" fill={S} stroke={A} strokeWidth="1.5" />
            <ellipse cx="19" cy="26" rx="3" ry="4" fill={D} />
            <ellipse cx="29" cy="26" rx="3" ry="4" fill={D} />
            <path
              d="M20 34h8"
              stroke={A}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </>
        );
      case "robot-6":
        return (
          <>
            <path
              d="M10 22 Q24 8 38 22"
              fill="none"
              stroke={A}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect x="11" y="20" width="26" height="20" rx="6" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="19" cy="28" r="3" fill={D} />
            <circle cx="29" cy="28" r="3" fill={D} />
            <rect x="20" y="35" width="8" height="2" rx="1" fill={M} />
          </>
        );
      case "robot-7":
        return (
          <>
            <path d="M24 8 L36 38 H12 Z" fill={S} stroke={A} strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="24" cy="26" r="2.5" fill={D} />
            <circle cx="19" cy="22" r="2" fill={D} />
            <circle cx="29" cy="22" r="2" fill={D} />
            <rect x="21" y="32" width="6" height="2" rx="1" fill={A} />
          </>
        );
      case "robot-8":
        return (
          <>
            <circle cx="24" cy="26" r="15" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="19" cy="24" r="3" fill={D} />
            <path
              d="M27 22 Q31 24 29 28"
              fill="none"
              stroke={D}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path d="M18 33h12" stroke={A} strokeWidth="2" strokeLinecap="round" />
            <circle cx="32" cy="14" r="2.5" fill={A} opacity="0.85" />
          </>
        );
      case "robot-9":
        return (
          <>
            <rect x="10" y="16" width="28" height="24" rx="6" fill={S} stroke={A} strokeWidth="1.5" />
            <circle cx="19" cy="26" r="2.5" fill={A} />
            <circle cx="29" cy="26" r="2.5" fill={A} />
            <path
              d="M16 34h4M22 34h4M28 34h4"
              stroke={M}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <rect x="20" y="10" width="8" height="4" rx="1" fill={A} />
            <line x1="14" y1="20" x2="10" y2="16" stroke={A} strokeWidth="1.2" />
            <line x1="34" y1="20" x2="38" y2="16" stroke={A} strokeWidth="1.2" />
          </>
        );
    }
  })();

  return (
    <svg
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      <rect width="48" height="48" rx="10" fill={D} />
      {inner}
    </svg>
  );
}
