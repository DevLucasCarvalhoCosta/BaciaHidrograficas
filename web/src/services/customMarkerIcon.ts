import L from 'leaflet'

/**
 * Create a compact professional marker icon for hydrological stations
 * Similar to ANA HidroWeb style but smaller and more efficient
 */
export function createStationMarkerIcon(isActive: boolean = true): L.DivIcon {
  const color = isActive ? '#0284c7' : '#64748b'
  const borderColor = isActive ? '#0369a1' : '#475569'
  const bgColor = isActive ? '#fff' : '#e2e8f0'
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
      ">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: ${bgColor};
          border: 2px solid ${color};
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            color: ${color};
            font-size: 10px;
            line-height: 1;
          ">💧</span>
        </div>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  })
}

/**
 * Alternative pin-style marker (similar to ANA HidroWeb)
 */
export function createPinStationMarker(isActive: boolean = true): L.DivIcon {
  const color = isActive ? '#0284c7' : '#64748b'
  const bgColor = '#ffffff'
  
  return L.divIcon({
    html: `
      <svg width="24" height="32" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <path d="M12 0C5.4 0 0 5.4 0 12c0 8 12 20 12 20s12-12 12-20c0-6.6-5.4-12-12-12z" 
              fill="${color}" filter="url(#shadow)"/>
        <circle cx="12" cy="12" r="6" fill="${bgColor}"/>
        <text x="12" y="16" text-anchor="middle" font-size="10" fill="${color}">💧</text>
      </svg>
    `,
    className: 'pin-marker-icon',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -32],
  })
}

/**
 * Cluster marker for multiple stations
 */
export function createClusterMarker(count: number, isActive: boolean = true): L.DivIcon {
  const color = isActive ? '#0284c7' : '#64748b'
  const bgColor = isActive ? '#e0f2fe' : '#f1f5f9'
  
  return L.divIcon({
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${bgColor};
        border: 3px solid ${color};
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 700;
        color: ${color};
      ">${count}</div>
    `,
    className: 'cluster-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  })
}
