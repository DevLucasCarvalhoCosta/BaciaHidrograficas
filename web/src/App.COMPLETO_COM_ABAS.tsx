import React, { useState } from 'react'
import { MapView } from './components/MapView'
import { SyncManager } from './components/SyncManager'
import { DataViewer } from './components/DataViewer'

type View = 'map' | 'sync' | 'data';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('map')

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegação */}
      <nav style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '15px 20px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <h1 style={{
          color: 'white',
          margin: 0,
          fontSize: '1.5em',
          flex: 1,
        }}>
          🌊 Bacias Hidrográficas
        </h1>

        <button
          onClick={() => setCurrentView('map')}
          style={{
            padding: '10px 20px',
            background: currentView === 'map' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: currentView === 'map' ? '2px solid white' : '2px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          🗺️ Mapa
        </button>

        <button
          onClick={() => setCurrentView('data')}
          style={{
            padding: '10px 20px',
            background: currentView === 'data' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: currentView === 'data' ? '2px solid white' : '2px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          📊 Dados
        </button>

        <button
          onClick={() => setCurrentView('sync')}
          style={{
            padding: '10px 20px',
            background: currentView === 'sync' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            color: 'white',
            border: currentView === 'sync' ? '2px solid white' : '2px solid transparent',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}
        >
          🔄 Sincronização
        </button>
      </nav>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f5f7fa' }}>
        {currentView === 'map' && (
          <div style={{ height: '100%', width: '100%' }}>
            <MapView />
          </div>
        )}

        {currentView === 'data' && (
          <div style={{ padding: '20px' }}>
            <DataViewer />
          </div>
        )}

        {currentView === 'sync' && (
          <div style={{ padding: '20px' }}>
            <SyncManager />
          </div>
        )}
      </div>
    </div>
  )
}
