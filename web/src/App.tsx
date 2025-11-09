import React, { useState } from 'react'
import { MapView } from './components/MapView'
import { SyncManager } from './components/SyncManager'
import { DataViewer } from './components/DataViewer'
import './styles/app.css'

type View = 'map' | 'sync' | 'data';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('map')
  const [selectedStationCode, setSelectedStationCode] = useState<string | undefined>(undefined)

  // Função para navegar para a aba de sincronização com uma estação específica
  const handleGoToSync = (codigoEstacao: string) => {
    setSelectedStationCode(codigoEstacao)
    setCurrentView('sync')
  }

  // Função para navegar para o mapa com uma estação específica
  const handleGoToMap = (codigoEstacao: string) => {
    setSelectedStationCode(codigoEstacao)
    setCurrentView('map')
  }

  // Limpar estação selecionada ao mudar de aba manualmente
  const handleViewChange = (view: View) => {
    // Sempre limpar a estação selecionada ao navegar manualmente
    setSelectedStationCode(undefined)
    setCurrentView(view)
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de Navegação */}
      <nav style={{
        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
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
          onClick={() => handleViewChange('map')}
          className={`nav-button ${currentView === 'map' ? 'active' : ''}`}
        >
          🗺️ Mapa
        </button>

        <button
          onClick={() => handleViewChange('data')}
          className={`nav-button ${currentView === 'data' ? 'active' : ''}`}
        >
          📊 Dados
        </button>

        <button
          onClick={() => handleViewChange('sync')}
          className={`nav-button ${currentView === 'sync' ? 'active' : ''}`}
        >
          🔄 Sincronização
        </button>
      </nav>

      {/* Conteúdo */}
      <div style={{ flex: 1, overflow: 'auto', background: '#f5f7fa' }}>
        {currentView === 'map' && (
          <div style={{ height: '100%', width: '100%' }}>
            <MapView 
              onGoToSync={handleGoToSync}
              selectedStationCode={selectedStationCode}
            />
          </div>
        )}

        {currentView === 'data' && (
          <div style={{ padding: '20px' }}>
            <DataViewer onGoToMap={handleGoToMap} />
          </div>
        )}

        {currentView === 'sync' && (
          <div style={{ padding: '20px' }}>
            <SyncManager codigoEstacaoInicial={selectedStationCode} />
          </div>
        )}
      </div>
    </div>
  )
}
