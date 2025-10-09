import L from 'leaflet'

// Fix default marker icon paths under Vite/ESM builds
export function fixLeafletIcons() {
  // Avoid re-running if already patched
  const anyL = L as any
  if (anyL.__defaultIconPatched) return

  const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).toString()
  const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).toString()
  const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).toString()

  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  })
  anyL.__defaultIconPatched = true
}
