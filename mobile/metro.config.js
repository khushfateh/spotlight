// Learn more: https://docs.expo.dev/guides/customizing-metro/
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Bundle 3D models (saxophone.glb) as assets so they can be require()'d
config.resolver.assetExts.push('glb', 'gltf')

// three ≥0.186 ships a deprecated CommonJS entry (three.cjs) that calls Node's
// `process.emitWarning` — which doesn't exist in React Native and crashes on
// launch. @react-three/fiber/native require()s 'three', so always point the
// bare 'three' import at the ES module build instead.
const THREE_ESM = path.resolve(__dirname, 'node_modules/three/build/three.module.js')
const upstreamResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'three') {
    return { type: 'sourceFile', filePath: THREE_ESM }
  }
  return upstreamResolve
    ? upstreamResolve(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform)
}

module.exports = config
