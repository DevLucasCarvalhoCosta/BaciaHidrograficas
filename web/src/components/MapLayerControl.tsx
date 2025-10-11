import React, { useState } from 'react'
import { TileLayer, LayersControl } from 'react-leaflet'

const { BaseLayer } = LayersControl

export interface MapLayer {
  name: string
  url: string
  attribution: string
  maxZoom?: number
  minZoom?: number
}

/**
 * Professional map layers for hydrological applications
 * All layers are from free/open sources
 */
export const MAP_LAYERS: Record<string, MapLayer> = {
  // OpenStreetMap - Padrão limpo
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  },
  
  // CARTO Voyager - Estilo moderno e limpo (usado no projeto atual)
  cartoVoyager: {
    name: 'CARTO Voyager (Atual)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  
  // CARTO Positron - Minimalista claro (excelente para dados)
  cartoPositron: {
    name: 'CARTO Light (Minimalista)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
  },
  
  // OpenTopoMap - Mapa topográfico com relevo
  openTopo: {
    name: 'OpenTopoMap (Topográfico)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://opentopomap.org">OpenTopoMap</a>',
    maxZoom: 17,
  },
  
  // Esri World Imagery - Satélite de alta qualidade
  esriSatellite: {
    name: 'Esri Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
  
  // Esri World Topo - Mapa topográfico detalhado
  esriTopo: {
    name: 'Esri Topográfico',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    maxZoom: 19,
  },
  
  // OpenStreetMap HOT - Humanitarian style (destaca hidrografia)
  osmHOT: {
    name: 'OSM Humanitarian (Rios)',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://www.hotosm.org/">HOT</a>',
    maxZoom: 19,
  },
  
  // Stamen Terrain - Destaca relevo e hidrografia
  stamenTerrain: {
    name: 'Stamen Terrain (Relevo)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18,
  },
  
  // Stamen Watercolor - Estilo artístico (destaca água)
  stamenWatercolor: {
    name: 'Stamen Watercolor (Artístico)',
    url: 'https://stamen-tiles-{s}.a.ssl.fastly.net/watercolor/{z}/{x}/{y}.jpg',
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 16,
  },
}

/**
 * Component for map layer selection with professional options
 */
export function MapLayerControl() {
  return (
    <LayersControl position="topright">
      <BaseLayer checked name="🗺️ CARTO Voyager (Padrão)">
        <TileLayer
          url={MAP_LAYERS.cartoVoyager.url}
          attribution={MAP_LAYERS.cartoVoyager.attribution}
          maxZoom={MAP_LAYERS.cartoVoyager.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🌟 CARTO Light (Minimalista)">
        <TileLayer
          url={MAP_LAYERS.cartoPositron.url}
          attribution={MAP_LAYERS.cartoPositron.attribution}
          maxZoom={MAP_LAYERS.cartoPositron.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="⛰️ Topográfico (OpenTopo)">
        <TileLayer
          url={MAP_LAYERS.openTopo.url}
          attribution={MAP_LAYERS.openTopo.attribution}
          maxZoom={MAP_LAYERS.openTopo.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="⛰️ Topográfico (Esri)">
        <TileLayer
          url={MAP_LAYERS.esriTopo.url}
          attribution={MAP_LAYERS.esriTopo.attribution}
          maxZoom={MAP_LAYERS.esriTopo.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🌊 Humanitarian (Rios)">
        <TileLayer
          url={MAP_LAYERS.osmHOT.url}
          attribution={MAP_LAYERS.osmHOT.attribution}
          maxZoom={MAP_LAYERS.osmHOT.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🏔️ Terrain (Relevo)">
        <TileLayer
          url={MAP_LAYERS.stamenTerrain.url}
          attribution={MAP_LAYERS.stamenTerrain.attribution}
          maxZoom={MAP_LAYERS.stamenTerrain.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🛰️ Satélite (Esri)">
        <TileLayer
          url={MAP_LAYERS.esriSatellite.url}
          attribution={MAP_LAYERS.esriSatellite.attribution}
          maxZoom={MAP_LAYERS.esriSatellite.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🎨 Watercolor (Artístico)">
        <TileLayer
          url={MAP_LAYERS.stamenWatercolor.url}
          attribution={MAP_LAYERS.stamenWatercolor.attribution}
          maxZoom={MAP_LAYERS.stamenWatercolor.maxZoom}
        />
      </BaseLayer>
      
      <BaseLayer name="🗺️ OpenStreetMap">
        <TileLayer
          url={MAP_LAYERS.osm.url}
          attribution={MAP_LAYERS.osm.attribution}
          maxZoom={MAP_LAYERS.osm.maxZoom}
        />
      </BaseLayer>
    </LayersControl>
  )
}

/**
 * Simple tile layer selector hook
 */
export function useMapLayer(defaultLayer: keyof typeof MAP_LAYERS = 'cartoVoyager') {
  const [currentLayer, setCurrentLayer] = useState(defaultLayer)
  
  return {
    currentLayer: MAP_LAYERS[currentLayer],
    setLayer: setCurrentLayer,
    availableLayers: MAP_LAYERS,
  }
}
