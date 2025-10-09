import L from 'leaflet'

/**
 * Create a modern custom marker icon for map stations
 */
export function createStationMarkerIcon(isActive: boolean = true): L.DivIcon {
  const color = isActive ? '#0284c7' : '#94a3b8'
  const borderColor = isActive ? '#0369a1' : '#64748b'
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
      ">
        <div style="
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 10px solid ${color};
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        "></div>
        <div style="
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 24px;
          height: 24px;
          background: ${color};
          border: 2px solid ${borderColor};
          border-radius: 50% 50% 50% 0;
          transform: translateX(-50%) rotate(-45deg);
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="
            transform: rotate(45deg);
            color: white;
            font-size: 14px;
            font-weight: bold;
            margin-top: -2px;
            margin-left: -1px;
          ">💧</span>
        </div>
      </div>
    `,
    className: 'custom-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

/**
 * Alternative simpler modern marker
 */
export function createSimpleStationMarker(isActive: boolean = true): L.DivIcon {
  const color = isActive ? '#0284c7' : '#94a3b8'
  
  return L.divIcon({
    html: `
      <div style="
        width: 28px;
        height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">💧</div>
    `,
    className: 'simple-marker-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}
