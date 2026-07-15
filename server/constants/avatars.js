// Preset robot avatars (robot-0 … robot-9). No file uploads.
const ROBOT_AVATAR_IDS = [
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

function isValidRobotAvatarId(id) {
  return typeof id === "string" && SET.has(id);
}

function coerceAvatarId(id) {
  if (typeof id === "string" && SET.has(id)) return id;
  return "robot-0";
}

module.exports = {
  ROBOT_AVATAR_IDS,
  isValidRobotAvatarId,
  coerceAvatarId,
};
