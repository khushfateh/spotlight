/**
 * Shared device tilt for brass surfaces — ONE accelerometer subscription no
 * matter how many buttons are on screen (ref-counted), exposed as Reanimated
 * shared values so shaders read it on the UI thread.
 */
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { makeMutable, withTiming } from 'react-native-reanimated'

export const tiltX = makeMutable(0)   // –1 (left) … 1 (right)
export const tiltY = makeMutable(0)

let users = 0
let sub: { remove: () => void } | null = null

function start() {
  if (Platform.OS === 'web' || sub) return
  try {
    // Required lazily so a missing native module can never crash a screen
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Accelerometer } = require('expo-sensors')
    Accelerometer.setUpdateInterval(60)
    sub = Accelerometer.addListener(({ x, y }: { x: number; y: number }) => {
      tiltX.value = withTiming(Math.max(-1, Math.min(1, x)), { duration: 140 })
      tiltY.value = withTiming(Math.max(-1, Math.min(1, y + 0.5)), { duration: 140 })  // held ~30° back
    })
  } catch {
    sub = null
  }
}

function stop() {
  sub?.remove()
  sub = null
}

/** Keep the shared tilt alive while the calling component is mounted. */
export function useTilt(enabled = true) {
  useEffect(() => {
    if (!enabled) return
    users += 1
    if (users === 1) start()
    return () => {
      users -= 1
      if (users === 0) stop()
    }
  }, [enabled])
}
