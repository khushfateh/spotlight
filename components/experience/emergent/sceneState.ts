// Shared singletons — written by GSAP / event handlers / useFrame,
// read every animation frame by SaxophoneScene, CameraRig, GoldDustCloud, DesertDust.

export const sceneState = {
  progress:  0,   // 0–1, GSAP ScrollTrigger
  pointerX:  0,   // global cursor NDC, -1 … 1 (set by window mousemove)
  pointerY:  0,
  dragRotY:  0,   // accumulated drag rotation Y (radians)
  dragRotX:  0,   // accumulated drag rotation X
  liveRotY:  0,   // written by SaxophoneScene each frame (needed by drag-start)
  liveRotX:  0,
}

// Saxophone world position, written by SaxophoneScene each frame.
// Read by GoldDustCloud to compute particle spring targets + velocity kick.
export const saxLivePos = { x: 0, y: 0, z: 0, prevX: 0, prevY: 0, prevZ: 0 }
