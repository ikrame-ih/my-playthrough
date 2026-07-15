// Must match server/constants/avatars.js
export const ROBOT_AVATAR_IDS = [
  "robot-0",
  "robot-1",
  "robot-2",
  "robot-3",
  "robot-4",
  "robot-5",
  "robot-6",
  "robot-7",
  "robot-8",
  "robot-9",
];

const SET = new Set(ROBOT_AVATAR_IDS);

export function coerceAvatarId(id) {
  if (typeof id === "string" && SET.has(id)) return id;
  return "robot-0";
}
