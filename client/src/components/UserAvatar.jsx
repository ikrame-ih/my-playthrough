import { coerceAvatarId } from "../constants/avatars";
import RobotAvatar from "./RobotAvatar";

const SIZE = {
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export default function UserAvatar({
  avatarId,
  size = "md",
  className = "",
  title,
}) {
  const id = coerceAvatarId(avatarId);
  const sz = SIZE[size] || SIZE.md;
  return (
    <RobotAvatar
      robotId={id}
      className={`${sz} shrink-0 rounded-[10px] ring-1 ring-white/[0.12] shadow-md ${className}`}
      title={title}
    />
  );
}
