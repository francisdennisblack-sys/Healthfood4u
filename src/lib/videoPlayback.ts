import type { SyntheticEvent } from "react";

export function enforceVideoMute({ currentTarget: video }: Pick<SyntheticEvent<HTMLVideoElement>, "currentTarget">) {
  if (!video.muted) video.muted = true;
  if (!video.defaultMuted) video.defaultMuted = true;
  if (video.volume !== 0) video.volume = 0;
}
