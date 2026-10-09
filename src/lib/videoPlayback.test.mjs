import test from "node:test";
import assert from "node:assert/strict";

import { enforceVideoMute } from "./videoPlayback.ts";

test("video playback is muted with zero volume", () => {
  const video = { muted: false, defaultMuted: false, volume: 1 };

  enforceVideoMute({ currentTarget: video });

  assert.deepEqual(video, { muted: true, defaultMuted: true, volume: 0 });
});

test("unmuting, raising volume, and replacing a video restore silence", () => {
  const video = { muted: true, defaultMuted: true, volume: 0 };

  for (const change of [
    { muted: false },
    { volume: 0.75 },
    { muted: false, defaultMuted: false, volume: 1 },
  ]) {
    Object.assign(video, change);
    enforceVideoMute({ currentTarget: video });
    assert.deepEqual(video, { muted: true, defaultMuted: true, volume: 0 });
  }
});

test("already-muted playback does not trigger further property changes", () => {
  const video = Object.freeze({ muted: true, defaultMuted: true, volume: 0 });

  assert.doesNotThrow(() => enforceVideoMute({ currentTarget: video }));
});
