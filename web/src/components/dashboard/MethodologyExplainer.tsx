import React, { useState } from 'react'
import './MethodologyExplainer.css'

export const MethodologyExplainer: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>('metrics')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="methodology-explainer">
      <div className="explainer-header">
        <h2>📚 Guia Metodológico do Dashboard</h2>
        <p className="explainer-subtitle">
          Entenda como os dados são coletados, processados e visualizados
        </p>
      </div>

      <div className="explainer-sections">
        {/* SEÇÃO 1: MÉTRICAS E CARDS */}
        <div className={`explainer-section ${expandedSection === 'metrics' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('metrics')}>
            <div className="section-title">
              <span className="section-icon">📊</span>
              <h3>1. Métricas e Cards Estatísticos</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'metrics' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'metrics' && (
            <div className="section-content">
              <div className="metric-explanation">
                <div className="metric-card-example chuva">
                  <div className="card-icon">🌧️</div>
                  <div className="card-content">
                    <div className="card-label">Chuva Acumulada</div>
                    <div className="card-value">156.8 <span className="unit">mm</span></div>
                    <div className="card-subtitle">Variação: 0.0 - 1288.4 mm</div>
                    <div className="card-trend positive">↑ +12.5%</div>
                  </div>
                </div>

                <div className="explanation-text">
                  <h4>O que é?</h4>
                  <p>
                    <strong>Chuva Acumulada</strong> representa a quantidade total de precipitação 
                    registrada pela estação no período analisado.
                  </p>

                  <h4>Como é calculada?</h4>
                  <ul>
                    <li><strong>Valor principal (156.8 mm):</strong> Média de todas as medições de chuva no período</li>
                    <li><strong>Variação (0.0 - 1288.4):</strong> Menor e maior valor registrado</li>
                    <li><strong>Tendência (+12.5%):</strong> Variação percentual em relação ao mês anterior</li>
                  </ul>

                  <div className="formula-box">
                    <strong>Fórmula SQL:</strong>
                    <code>
                      AVG(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_media
                      <br/>MIN(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_min
                      <br/>MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_max
                    </code>
                  </div>

                  <h4>Como interpretar?</h4>
                  <ul>
                    <li>✅ <strong>Verde (↑):</strong> Aumento na precipitação (mais chuvas)</li>
                    <li>❌ <strong>Vermelho (↓):</strong> Redução na precipitação (período mais seco)</li>
                    <li>📊 <strong>Valores altos (&gt;100mm):</strong> Indicam mês chuvoso</li>
                    <li>📊 <strong>Valores baixos (&lt;50mm):</strong> Indicam mês seco</li>
                  </ul>
                </div>
              </div>

              <div className="metric-explanation">
                <div className="metric-card-example temperatura">
                  <div className="card-icon">🌡️</div>
                  <div className="card-content">
                    <div className="card-label">Temperatura da Água</div>
                    <div className="card-value">23.4 <span className="unit">°C</span></div>
                    <div className="card-subtitle">Variação: 18.2 - 28.7 °C</div>
                    <div className="card-trend negative">↓ -2.1%</div>
                  </div>
                </div>

                <div className="explanation-text">
                  <h4>O que é?</h4>
                  <p>
                    <strong>Temperatura da Água</strong> mede o calor do corpo hídrico, 
                    importante para qualidade ambiental e vida aquática.
                  </p>

                  <h4>Como é calculada?</h4>
                  <ul>
                    <li><strong>Valor principal:</strong> Média de todas as temperaturas do período</li>
                    <li><strong>Amplitude térmica:</strong> Diferença entre menor e maior temperatura</li>
                  </ul>

                  <h4>Como interpretar?</h4>
                  <ul>
                    <li>🟢 <strong>20-25°C:</strong> Temperatura ideal para maioria dos ecossistemas</li>
                    <li>🟡 <strong>25-30°C:</strong> Temperatura elevada, atenção ao estresse térmico</li>
                    <li>🔴 <strong>&gt;30°C:</strong> Temperatura crítica, risco à vida aquática</li>
                    <li>🔵 <strong>&lt;15°C:</strong> Temperatura baixa, incomum para rios tropicais</li>
                  </ul>
                </div>
              </div>

              <div className="metric-explanation">
                <div className="metric-card-example bateria">
                  <div className="card-icon">🔋</div>
                  <div className="card-content">
                    <div className="card-label">Bateria do Equipamento</div>
                    <div className="card-value">13.2 <span className="unit">V</span></div>
                    <div className="card-subtitle">Variação: 12.8 - 13.5 V</div>
                  </div>
                </div>

                <div className="explanation-text">
                  <h4>O que é?</h4>
                  <p>
                    <strong>Tensão da Bateria</strong> indica o estado de carga do sistema 
                    de alimentação da estação telemétrica.
                  </p>

                  <h4>Por que é importante?</h4>
                  <ul>
                    <li>🔋 <strong>&gt;12.5V:</strong> Bateria saudável, sistema operando normalmente</li>
                    <li>⚠️ <strong>12.0-12.5V:</strong> Bateria descarregando, monitorar</li>
                    <li>🚨 <strong>&lt;12.0V:</strong> Bateria crítica, risco de perda de dados</li>
                  </ul>

                  <p className="info-box">
                    <strong>💡 Dica:</strong> Quedas bruscas podem indicar falha no painel solar 
                    ou necessidade de manutenção preventiva.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 2: GRÁFICOS DIÁRIOS */}
        <div className={`explainer-section ${expandedSection === 'daily' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('daily')}>
            <div className="section-title">
              <span className="section-icon">📈</span>
              <h3>2. Gráficos de Dados Diários</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'daily' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'daily' && (
            <div className="section-content">
              <div className="chart-explanation">
                <h4>🌧️ Gráfico: Chuva Máxima Diária (Barras)</h4>
                
                <div className="chart-visual-example">
                  <svg viewBox="0 0 400 150" className="mini-chart">
                    {/* Eixos */}
                    <line x1="40" y1="10" x2="40" y2="130" stroke="#94a3b8" strokeWidth="2"/>
                    <line x1="40" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="2"/>
                    
                    {/* Barras */}
                    <rect x="60" y="80" width="20" height="50" fill="url(#blueGradient)"/>
                    <rect x="100" y="40" width="20" height="90" fill="url(#blueGradient)"/>
                    <rect x="140" y="95" width="20" height="35" fill="url(#blueGradient)"/>
                    <rect x="180" y="110" width="20" height="20" fill="url(#blueGradient)"/>
                    <rect x="220" y="60" width="20" height="70" fill="url(#blueGradient)"/>
                    <rect x="260" y="90" width="20" height="40" fill="url(#blueGradient)"/>
                    <rect x="300" y="70" width="20" height="60" fill="url(#blueGradient)"/>
                    <rect x="340" y="100" width="20" height="30" fill="url(#blueGradient)"/>
                    
                    {/* Grade */}
                    <line x1="60" y1="10" x2="60" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2"/>
                    <line x1="100" y1="10" x2="100" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2"/>
                    <line x1="140" y1="10" x2="140" y2="130" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2"/>
                    
                    {/* Labels */}
                    <text x="65" y="145" fontSize="10" fill="#64748b" textAnchor="middle">D1</text>
                    <text x="105" y="145" fontSize="10" fill="#64748b" textAnchor="middle">D2</text>
                    <text x="145" y="145" fontSize="10" fill="#64748b" textAnchor="middle">D3</text>
                    <text x="360" y="145" fontSize="10" fill="#64748b" textAnchor="middle">...</text>
                    
                    {/* Gradient */}
                    <defs>
                      <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="1"/>
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.7"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                <div className="explanation-text">
                  <h4>O que mostra?</h4>
                  <p>
                    Cada <strong>barra</strong> representa um dia do mês selecionado. 
                    A altura indica o <strong>pico máximo de precipitação</strong> registrado naquele dia.
                  </p>

                  <h4>Processamento dos dados</h4>
                  <ol>
                    <li><strong>Coleta:</strong> Estação mede chuva a cada 15 minutos (~96 medições/dia)</li>
                    <li><strong>Agregação:</strong> Sistema seleciona o MAIOR valor do dia</li>
                    <li><strong>Visualização:</strong> Uma barra por dia mostrando o pico</li>
                  </ol>

                  <div className="formula-box">
                    <strong>SQL de Agregação:</strong>
                    <code>
                      SELECT DATE("Data_Hora_Medicao") as dia,
                      <br/>&nbsp;&nbsp;MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima
                      <br/>FROM "SerieTelemetrica"
                      <br/>GROUP BY DATE("Data_Hora_Medicao")
                    </code>
                  </div>

                  <h4>Como interpretar?</h4>
                  <ul>
                    <li>📊 <strong>Barras altas (&gt;20mm):</strong> Dias com eventos de chuva intensa</li>
                    <li>🌊 <strong>Picos extremos (&gt;50mm/dia):</strong> MUITA água caindo → Alto risco de enchentes e alagamentos</li>
                    <li>📊 <strong>Barras baixas (1-10mm):</strong> Chuvas leves ou garoa</li>
                    <li>🏜️ <strong>Barras ausentes (0mm):</strong> Dias secos → Vários dias assim = risco de seca</li>
                    <li>📉 <strong>Padrão uniforme:</strong> Chuvas bem distribuídas ao longo do mês (ideal)</li>
                    <li>⚠️ <strong>Grandes variações:</strong> Chuvas concentradas em poucos dias (problemático)</li>
                  </ul>
                </div>
              </div>

              <div className="chart-explanation">
                <h4>🌡️ Gráfico: Temperatura Média Diária (Linha)</h4>
                
                <div className="chart-visual-example">
                  <svg viewBox="0 0 400 150" className="mini-chart">
                    {/* Eixos */}
                    <line x1="40" y1="10" x2="40" y2="130" stroke="#94a3b8" strokeWidth="2"/>
                    <line x1="40" y1="130" x2="380" y2="130" stroke="#94a3b8" strokeWidth="2"/>
                    
                    {/* Linha */}
                    <polyline 
                      points="60,70 100,65 140,80 180,75 220,60 260,55 300,65 340,70" 
                      fill="none" 
                      stroke="#ef4444" 
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Pontos */}
                    <circle cx="60" cy="70" r="4" fill="#ef4444"/>
                    <circle cx="100" cy="65" r="4" fill="#ef4444"/>
                    <circle cx="140" cy="80" r="4" fill="#ef4444"/>
                    <circle cx="180" cy="75" r="4" fill="#ef4444"/>
                    <circle cx="220" cy="60" r="4" fill="#ef4444"/>
                    <circle cx="260" cy="55" r="4" fill="#ef4444"/>
                    <circle cx="300" cy="65" r="4" fill="#ef4444"/>
                    <circle cx="340" cy="70" r="4" fill="#ef4444"/>
                    
                    {/* Grade */}
                    <line x1="40" y1="50" x2="380" y2="50" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2"/>
                    <line x1="40" y1="90" x2="380" y2="90" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="2,2"/>
                    
                    {/* Labels */}
                    <text x="65" y="145" fontSize="10" fill="#64748b" textAnchor="middle">D1</text>
                    <text x="105" y="145" fontSize="10" fill="#64748b" textAnchor="middle">D2</text>
                    <text x="360" y="145" fontSize="10" fill="#64748b" textAnchor="middle">...</text>
                  </svg>
                </div>

                <div className="explanation-text">
                  <h4>O que mostra?</h4>
                  <p>
                    Cada <strong>ponto</strong> na linha representa a <strong>temperatura média</strong> 
                    da água em um dia. A linha conecta os pontos para mostrar a tendência.
                  </p>

                  <h4>Processamento dos dados</h4>
                  <ol>
                    <li><strong>Coleta:</strong> Estação mede temperatura a cada 15 minutos</li>
                    <li><strong>Agregação:</strong> Sistema calcula MÉDIA de todas as medições do dia</li>
                    <li><strong>Visualização:</strong> Linha contínua mostrando evolução</li>
                  </ol>

                  <div className="formula-box">
                    <strong>SQL de Agregação:</strong>
                    <code>
                      SELECT DATE("Data_Hora_Medicao") as dia,
                      <br/>&nbsp;&nbsp;AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media
                      <br/>FROM "SerieTelemetrica"
                      <br/>GROUP BY DATE("Data_Hora_Medicao")
                    </code>
                  </div>

                  <h4>Como interpretar?</h4>
                  <ul>
                    <li>📈 <strong>Linha ascendente:</strong> Aquecimento progressivo da água</li>
                    <li>📉 <strong>Linha descendente:</strong> Resfriamento da água</li>
                    <li>➖ <strong>Linha estável:</strong> Temperatura constante</li>
                    <li>⚡ <strong>Picos abruptos:</strong> Mudanças climáticas repentinas ou entrada de afluentes</li>
                    <li>🌊 <strong>Oscilações:</strong> Variações naturais dia/noite</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 3: TENDÊNCIAS MENSAIS */}
        <div className={`explainer-section ${expandedSection === 'trends' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('trends')}>
            <div className="section-title">
              <span className="section-icon">📊</span>
              <h3>3. Tendências Mensais e Comparações</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'trends' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'trends' && (
            <div className="section-content">
              <div className="chart-explanation">
                <h4>📊 Gráfico Comparativo Mensal (Duplo Eixo)</h4>
                
                <div className="explanation-text">
                  <h4>O que mostra?</h4>
                  <p>
                    Sobrepõe <strong>chuva</strong> (barras azuis) e <strong>temperatura</strong> (linha vermelha) 
                    no mesmo gráfico para identificar correlações. Cada mês apresenta também 
                    <strong> indicadores de tendência</strong> mostrando variação em relação ao mês anterior.
                  </p>

                  <h4>Por que dois eixos?</h4>
                  <ul>
                    <li><strong>Eixo Y esquerdo (azul):</strong> Precipitação em mm (0-500)</li>
                    <li><strong>Eixo Y direito (vermelho):</strong> Temperatura em °C (15-35)</li>
                    <li><strong>Eixo X:</strong> Meses do ano</li>
                  </ul>

                  <h4>📈 Indicadores de Tendência</h4>
                  <p style={{marginBottom: '16px'}}>
                    As setas ao lado de cada valor mostram se houve aumento (↑), diminuição (↓) ou 
                    estabilidade (→) em relação ao mês anterior:
                  </p>
                  
                  <div className="trend-indicators-demo" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                      borderRadius: '8px',
                      border: '2px solid #10b981',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '24px', marginBottom: '4px'}}>↑ +30.1%</div>
                      <div style={{fontSize: '13px', color: '#065f46', fontWeight: 600}}>
                        Tendência Positiva
                      </div>
                      <div style={{fontSize: '12px', color: '#047857', marginTop: '4px'}}>
                        Aumento em relação<br/>ao mês anterior
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      borderRadius: '8px',
                      border: '2px solid #ef4444',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '24px', marginBottom: '4px'}}>↓ -5.3%</div>
                      <div style={{fontSize: '13px', color: '#991b1b', fontWeight: 600}}>
                        Tendência Negativa
                      </div>
                      <div style={{fontSize: '12px', color: '#b91c1c', marginTop: '4px'}}>
                        Diminuição em relação<br/>ao mês anterior
                      </div>
                    </div>

                    <div style={{
                      padding: '12px',
                      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      borderRadius: '8px',
                      border: '2px solid #64748b',
                      textAlign: 'center'
                    }}>
                      <div style={{fontSize: '24px', marginBottom: '4px'}}>→ +0.2%</div>
                      <div style={{fontSize: '13px', color: '#334155', fontWeight: 600}}>
                        Estável
                      </div>
                      <div style={{fontSize: '12px', color: '#475569', marginTop: '4px'}}>
                        Sem mudança<br/>significativa
                      </div>
                    </div>
                  </div>

                  <h4>🧮 Como são calculadas as tendências?</h4>
                  
                  <div className="calculation-boxes" style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px'}}>
                    <div style={{
                      background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #3b82f6',
                      boxShadow: '0 4px 6px rgba(59, 130, 246, 0.1)'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                        <div style={{
                          background: '#3b82f6',
                          color: 'white',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>🌧️</div>
                        <strong style={{fontSize: '16px', color: '#1e40af'}}>Tendência de Chuva</strong>
                      </div>
                      
                      <div className="formula-box" style={{background: 'white', marginBottom: '12px'}}>
                        <code style={{color: '#1e40af'}}>
                          <strong>Fórmula:</strong>
                          <br/>((Chuva Atual - Chuva Anterior) ÷ Chuva Anterior) × 100
                        </code>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        <strong>📝 Exemplo prático:</strong>
                        <div style={{marginTop: '8px', fontFamily: 'monospace'}}>
                          Janeiro: <strong>120.5 mm</strong>
                          <br/>Fevereiro: <strong>156.8 mm</strong>
                          <br/><br/>Cálculo: ((156.8 - 120.5) ÷ 120.5) × 100
                          <br/>Resultado: <span style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>↑ +30.1%</span>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #ef4444',
                      boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
                    }}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px'}}>
                        <div style={{
                          background: '#ef4444',
                          color: 'white',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>🌡️</div>
                        <strong style={{fontSize: '16px', color: '#991b1b'}}>Tendência de Temperatura</strong>
                      </div>
                      
                      <div className="formula-box" style={{background: 'white', marginBottom: '12px'}}>
                        <code style={{color: '#991b1b'}}>
                          <strong>Fórmula:</strong>
                          <br/>((Temp Atual - Temp Anterior) ÷ Temp Anterior) × 100
                        </code>
                      </div>

                      <div style={{
                        background: 'rgba(255, 255, 255, 0.7)',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}>
                        <strong>📝 Exemplo prático:</strong>
                        <div style={{marginTop: '8px', fontFamily: 'monospace'}}>
                          Março: <strong>24.5 °C</strong>
                          <br/>Abril: <strong>23.2 °C</strong>
                          <br/><br/>Cálculo: ((23.2 - 24.5) ÷ 24.5) × 100
                          <br/>Resultado: <span style={{
                            background: '#ef4444',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>↓ -5.3%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4>💡 Cenários de Análise Combinada</h4>
                  
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px'}}>
                    <div style={{
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #0284c7',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        background: '#0284c7',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        Cenário 1
                      </div>
                      <div style={{flex: 1}}>
                        <strong style={{color: '#075985', fontSize: '15px'}}>🌧️ Entrada do período chuvoso</strong>
                        <div style={{marginTop: '8px', fontSize: '14px', lineHeight: '1.6'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                            <span style={{background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Chuva ↑ +85%
                            </span>
                            <span style={{color: '#0c4a6e'}}>Grande aumento de precipitação</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <span style={{background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Temp ↓ -12%
                            </span>
                            <span style={{color: '#0c4a6e'}}>Redução da temperatura</span>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#164e63'
                          }}>
                            <strong>📊 Interpretação:</strong> Padrão típico tropical! Mais chuvas = 
                            cobertura de nuvens + resfriamento evaporativo → temperatura mais baixa.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #f59e0b',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        Cenário 2
                      </div>
                      <div style={{flex: 1}}>
                        <strong style={{color: '#92400e', fontSize: '15px'}}>☀️ Período de estiagem</strong>
                        <div style={{marginTop: '8px', fontSize: '14px', lineHeight: '1.6'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                            <span style={{background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Chuva ↓ -65%
                            </span>
                            <span style={{color: '#78350f'}}>Grande redução de precipitação</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <span style={{background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Temp ↑ +18%
                            </span>
                            <span style={{color: '#78350f'}}>Aumento da temperatura</span>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#92400e'
                          }}>
                            <strong>⚠️ Alerta:</strong> Menos chuvas = mais sol direto aquecendo a água. 
                            Risco de estresse térmico em organismos aquáticos. Monitorar qualidade da água!
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{
                      background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '2px solid #dc2626',
                      display: 'flex',
                      gap: '16px',
                      alignItems: 'flex-start'
                    }}>
                      <div style={{
                        background: '#dc2626',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}>
                        Cenário 3
                      </div>
                      <div style={{flex: 1}}>
                        <strong style={{color: '#991b1b', fontSize: '15px'}}>⚡ Padrão atípico (alerta!)</strong>
                        <div style={{marginTop: '8px', fontSize: '14px', lineHeight: '1.6'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px'}}>
                            <span style={{background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Chuva ↑ +45%
                            </span>
                            <span style={{color: '#7f1d1d'}}>Aumento de precipitação</span>
                          </div>
                          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px'}}>
                            <span style={{background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold'}}>
                              Temp ↑ +22%
                            </span>
                            <span style={{color: '#7f1d1d'}}>Aumento de temperatura (???)</span>
                          </div>
                          <div style={{
                            background: 'rgba(255, 255, 255, 0.7)',
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#991b1b'
                          }}>
                            <strong>🚨 Anomalia:</strong> Ambos subindo juntos é INCOMUM! Pode indicar 
                            chuvas convectivas de verão (calor → tempestades) ou mudanças climáticas. 
                            Investigar padrão!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <h4>Processamento dos dados</h4>
                  <div className="formula-box">
                    <strong>Agregação Mensal:</strong>
                    <code>
                      SELECT TO_CHAR(DATE_TRUNC('month', "Data_Hora_Medicao"), 'YYYY-MM') as mes,
                      <br/>&nbsp;&nbsp;MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
                      <br/>&nbsp;&nbsp;AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
                      <br/>&nbsp;&nbsp;COUNT(*) as total_medicoes
                      <br/>FROM "SerieTelemetrica"
                      <br/>GROUP BY DATE_TRUNC('month', "Data_Hora_Medicao")
                      <br/>ORDER BY mes ASC
                    </code>
                  </div>

                  <h4>Padrões a observar no gráfico:</h4>
                  <ul>
                    <li>🔄 <strong>Correlação inversa:</strong> Quando barras sobem, linha desce (e vice-versa) - Normal!</li>
                    <li>📊 <strong>Sazonalidade:</strong> Repetição de padrões em meses similares entre anos</li>
                    <li>📈 <strong>Tendências crescentes:</strong> Ambos indicadores subindo mês a mês</li>
                    <li>📉 <strong>Tendências decrescentes:</strong> Ambos indicadores caindo mês a mês</li>
                    <li>⚠️ <strong>Anomalias:</strong> Mudanças bruscas ou padrões atípicos que fogem do esperado</li>
                  </ul>
                </div>
              </div>

              <div className="chart-explanation">
                <h4>🗓️ Mapa de Calor (Heatmap)</h4>
                
                <div className="explanation-text">
                  <h4>O que mostra?</h4>
                  <p>
                    Matriz colorida onde cada célula representa um mês. 
                    Cores indicam <strong>intensidade</strong> da temperatura.
                  </p>

                  <div className="color-scale">
                    <div className="scale-item">
                      <div className="color-box" style={{background: '#3b82f6'}}></div>
                      <span>Frio (&lt;20°C)</span>
                    </div>
                    <div className="scale-item">
                      <div className="color-box" style={{background: '#10b981'}}></div>
                      <span>Ideal (20-25°C)</span>
                    </div>
                    <div className="scale-item">
                      <div className="color-box" style={{background: '#f59e0b'}}></div>
                      <span>Quente (25-30°C)</span>
                    </div>
                    <div className="scale-item">
                      <div className="color-box" style={{background: '#ef4444'}}></div>
                      <span>Muito Quente (&gt;30°C)</span>
                    </div>
                  </div>

                  <h4>Como interpretar?</h4>
                  <ul>
                    <li>👀 <strong>Identificação rápida:</strong> Meses problemáticos saltam aos olhos</li>
                    <li>📈 <strong>Tendências anuais:</strong> Ver se ano está mais quente que o anterior</li>
                    <li>🔍 <strong>Padrões sazonais:</strong> Verão vs inverno, meses chuvosos vs secos</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 4: INSIGHTS AUTOMÁTICOS */}
        <div className={`explainer-section ${expandedSection === 'insights' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('insights')}>
            <div className="section-title">
              <span className="section-icon">💡</span>
              <h3>4. Insights Inteligentes Automáticos</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'insights' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'insights' && (
            <div className="section-content">
              <div className="insight-explanation">
                <h4>Como os insights são gerados?</h4>
                
                <div className="insight-flow">
                  <div className="flow-step">
                    <div className="step-number">1</div>
                    <div className="step-content">
                      <h5>Coleta de Dados Históricos</h5>
                      <p>Sistema busca todos os dados mensais da estação</p>
                    </div>
                  </div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step">
                    <div className="step-number">2</div>
                    <div className="step-content">
                      <h5>Cálculos Estatísticos</h5>
                      <p>Média, desvio padrão, máximos, mínimos, tendências</p>
                    </div>
                  </div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step">
                    <div className="step-number">3</div>
                    <div className="step-content">
                      <h5>Detecção de Padrões</h5>
                      <p>Identifica sazonalidade, anomalias, correlações</p>
                    </div>
                  </div>
                  <div className="flow-arrow">↓</div>
                  <div className="flow-step">
                    <div className="step-number">4</div>
                    <div className="step-content">
                      <h5>Geração de Texto</h5>
                      <p>Traduz análises em insights legíveis</p>
                    </div>
                  </div>
                </div>

                <h4>Tipos de Insights Gerados</h4>

                <div className="insight-types">
                  <div className="insight-type">
                    <div className="type-icon">📈</div>
                    <div className="type-content">
                      <h5>1. Tendências de Crescimento</h5>
                      <p className="example-insight">
                        "📈 Tendência de aumento: Temperatura média cresceu 3.2% nos últimos 3 meses"
                      </p>
                      <p className="explanation">
                        <strong>Cálculo:</strong> Compara média dos últimos 3 meses com os 3 anteriores
                        <br/><code>((Recente - Anterior) / Anterior) × 100</code>
                      </p>
                      <div className="data-evidence-example">
                        <strong>📊 Análise dos Dados (novo!):</strong>
                        <p style={{fontSize: '13px', color: '#059669', marginTop: '8px', lineHeight: '1.6'}}>
                          "Comparando os extremos do período analisado, a temperatura passou de 22.1°C 
                          em 2024-10 para 24.3°C em 2025-01, representando uma variação de +3.2% 
                          (2.2°C em termos absolutos). Esta mudança excede o limiar de 15% considerado 
                          significativo para análises de tendências térmicas."
                        </p>
                        <p style={{fontSize: '12px', color: '#64748b', marginTop: '4px'}}>
                          ✨ Cada insight agora inclui explicação detalhada de como foi calculado, 
                          com valores exatos dos dados analisados!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="insight-type">
                    <div className="type-icon">🌊</div>
                    <div className="type-content">
                      <h5>2. Eventos Extremos</h5>
                      <p className="example-insight">
                        "⚠️ Evento extremo: Chuva de 85.6mm em janeiro superou a média histórica em 150%"
                      </p>
                      <p className="explanation">
                        <strong>Cálculo:</strong> Identifica valores que excedem 3× a média
                        <br/><code>valor &gt; (média × 3)</code>
                      </p>
                      <div className="data-evidence-example">
                        <strong>📊 Análise dos Dados:</strong>
                        <p style={{fontSize: '13px', color: '#059669', marginTop: '8px', lineHeight: '1.6'}}>
                          "Evento extremo detectado em 2025-01 com precipitação máxima de 85.6mm. 
                          Este valor excede em 250% a média do período (24.5mm) e é 3.5x superior, 
                          ultrapassando o limiar de 3x que define eventos extremos."
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="insight-type">
                    <div className="type-icon">🔄</div>
                    <div className="type-content">
                      <h5>3. Sazonalidade</h5>
                      <p className="example-insight">
                        "📅 Padrão sazonal detectado: Chuvas concentradas entre outubro e março"
                      </p>
                      <p className="explanation">
                        <strong>Cálculo:</strong> Agrupa dados por mês do ano e identifica concentrações
                        <br/><code>80% das chuvas em 6 meses = sazonalidade forte</code>
                      </p>
                    </div>
                  </div>

                  <div className="insight-type">
                    <div className="type-icon">🔗</div>
                    <div className="type-content">
                      <h5>4. Correlações</h5>
                      <p className="example-insight">
                        "🔗 Correlação inversa forte: Quando chuvas aumentam, temperatura cai em média 2.5°C"
                      </p>
                      <p className="explanation">
                        <strong>Cálculo:</strong> Coeficiente de correlação de Pearson
                        <br/><code>r = -0.78 (correlação inversa forte)</code>
                      </p>
                    </div>
                  </div>

                  <div className="insight-type">
                    <div className="type-icon">⚖️</div>
                    <div className="type-content">
                      <h5>5. Comparações Temporais</h5>
                      <p className="example-insight">
                        "📊 Comparação anual: 2025 está 12% mais chuvoso que 2024"
                      </p>
                      <p className="explanation">
                        <strong>Cálculo:</strong> Soma total de chuvas por ano e compara
                        <br/><code>(Total_2025 - Total_2024) / Total_2024 × 100</code>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="info-box">
                  <h5>🤖 Automação Inteligente</h5>
                  <p>
                    Todos os insights são <strong>gerados automaticamente</strong> a cada vez que você 
                    abre o dashboard. O sistema analisa os dados em tempo real e apresenta as 
                    descobertas mais relevantes.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 5: ALERTAS */}
        <div className={`explainer-section ${expandedSection === 'alerts' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('alerts')}>
            <div className="section-title">
              <span className="section-icon">🚨</span>
              <h3>5. Sistema de Alertas</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'alerts' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'alerts' && (
            <div className="section-content">
              <div className="alert-explanation">
                <h4>O que são os alertas?</h4>
                <p>
                  Sistema automático que <strong>identifica e destaca</strong> medições 
                  que fogem do padrão normal, indicando possíveis problemas.
                </p>

                <div className="alert-types">
                  <div className="alert-type warning">
                    <div className="alert-header">
                      <span className="alert-icon">🔥</span>
                      <h5>Temperatura Alta (&gt;30°C)</h5>
                      <span className="severity-badge">Atenção</span>
                    </div>
                    <div className="alert-content">
                      <p><strong>Critério:</strong></p>
                      <code>WHERE CAST("Temperatura_Agua" AS DECIMAL) &gt; 30</code>
                      
                      <p><strong>Possíveis causas:</strong></p>
                      <ul>
                        <li>🌡️ Onda de calor prolongada</li>
                        <li>☀️ Baixo nível de água (mais exposição ao sol)</li>
                        <li>🏭 Descarga de efluentes quentes</li>
                        <li>⚠️ Falha de calibração do sensor</li>
                      </ul>

                      <p><strong>Impactos:</strong></p>
                      <ul>
                        <li>🐟 Estresse térmico em peixes</li>
                        <li>🦠 Proliferação de algas</li>
                        <li>💨 Redução de oxigênio dissolvido</li>
                      </ul>
                    </div>
                  </div>

                  <div className="alert-type info">
                    <div className="alert-header">
                      <span className="alert-icon">❄️</span>
                      <h5>Temperatura Baixa (&lt;15°C)</h5>
                      <span className="severity-badge">Informativo</span>
                    </div>
                    <div className="alert-content">
                      <p><strong>Critério:</strong></p>
                      <code>WHERE CAST("Temperatura_Agua" AS DECIMAL) &lt; 15</code>
                      
                      <p><strong>Possíveis causas:</strong></p>
                      <ul>
                        <li>🌧️ Frente fria intensa</li>
                        <li>💧 Entrada de nascentes geladas</li>
                        <li>🏔️ Degelo de montanhas</li>
                        <li>⚠️ Erro de medição</li>
                      </ul>

                      <p><strong>Observação:</strong></p>
                      <p>
                        Incomum para rios brasileiros em baixas altitudes. 
                        Mais comum em regiões serranas ou durante inverno rigoroso.
                      </p>
                    </div>
                  </div>

                  <div className="alert-type danger">
                    <div className="alert-header">
                      <span className="alert-icon">🔋</span>
                      <h5>Bateria Baixa (&lt;12V)</h5>
                      <span className="severity-badge">Urgente</span>
                    </div>
                    <div className="alert-content">
                      <p><strong>Critério:</strong></p>
                      <code>WHERE CAST("Bateria" AS DECIMAL) &lt; 12.0</code>
                      
                      <p><strong>Possíveis causas:</strong></p>
                      <ul>
                        <li>☁️ Dias nublados (baixa carga solar)</li>
                        <li>🔧 Painel solar sujo ou danificado</li>
                        <li>🔌 Problema no sistema de carga</li>
                        <li>📉 Bateria no fim da vida útil</li>
                      </ul>

                      <p><strong>Riscos:</strong></p>
                      <ul>
                        <li>❌ Perda de dados por desligamento</li>
                        <li>📡 Falha na transmissão</li>
                        <li>⏰ Gaps na série histórica</li>
                      </ul>

                      <p><strong>Ação recomendada:</strong></p>
                      <p className="action-box">
                        🔧 Agendar manutenção preventiva com equipe técnica
                      </p>
                    </div>
                  </div>
                </div>

                <div className="info-box">
                  <h5>📋 Como usar os alertas</h5>
                  <ol>
                    <li>Verifique a <strong>data</strong> do alerta (pode ser antigo)</li>
                    <li>Consulte o <strong>histórico</strong> para ver se é recorrente</li>
                    <li>Cruze com <strong>outras métricas</strong> (chuva, vazão, etc.)</li>
                    <li>Se persistir, <strong>reporte</strong> à equipe responsável</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SEÇÃO 6: DADOS BRUTOS VS AGREGADOS */}
        <div className={`explainer-section ${expandedSection === 'data' ? 'expanded' : ''}`}>
          <div className="section-header" onClick={() => toggleSection('data')}>
            <div className="section-title">
              <span className="section-icon">📋</span>
              <h3>6. Dados Brutos vs Dados Agregados</h3>
            </div>
            <span className="toggle-icon">{expandedSection === 'data' ? '−' : '+'}</span>
          </div>
          
          {expandedSection === 'data' && (
            <div className="section-content">
              <div className="data-comparison">
                <h4>Entenda a diferença</h4>

                <div className="comparison-grid">
                  <div className="comparison-card raw">
                    <h5>📋 Dados Brutos</h5>
                    <div className="card-content">
                      <p><strong>O que são?</strong></p>
                      <p>Medições originais da estação, <strong>sem processamento</strong></p>

                      <p><strong>Frequência:</strong></p>
                      <p>A cada <strong>15 minutos</strong> (~96 registros/dia)</p>

                      <p><strong>Exemplo de dia:</strong></p>
                      <div className="data-example">
                        <code>
                          2025-01-15 00:00 → 23.5°C, 15.2mm
                          <br/>2025-01-15 00:15 → 23.4°C, 15.3mm
                          <br/>2025-01-15 00:30 → 23.6°C, 15.3mm
                          <br/>... (91 registros omitidos)
                          <br/>2025-01-15 23:45 → 22.1°C, 18.9mm
                        </code>
                      </div>

                      <p><strong>Quando usar?</strong></p>
                      <ul>
                        <li>✅ Análises de alta resolução temporal</li>
                        <li>✅ Estudar eventos específicos (ex: tempestade das 14h)</li>
                        <li>✅ Validar dados questionáveis</li>
                        <li>✅ Exportar para análises externas</li>
                      </ul>

                      <p><strong>Campos disponíveis (22):</strong></p>
                      <ul className="field-list">
                        <li>Data/Hora Medição</li>
                        <li>Chuva Acumulada + Status</li>
                        <li>Chuva Adotada + Status</li>
                        <li>Cota Sensor + Status</li>
                        <li>Cota Adotada + Status</li>
                        <li>Cota Display + Status</li>
                        <li>Cota Manual + Status</li>
                        <li>Vazão Adotada + Status</li>
                        <li>Temperatura Água + Status</li>
                        <li>Temperatura Interna</li>
                        <li>Pressão Atmosférica + Status</li>
                        <li>Bateria</li>
                      </ul>
                    </div>
                  </div>

                  <div className="comparison-card aggregated">
                    <h5>📊 Dados Agregados</h5>
                    <div className="card-content">
                      <p><strong>O que são?</strong></p>
                      <p>Consolidação dos dados brutos em <strong>valores únicos por dia</strong></p>

                      <p><strong>Frequência:</strong></p>
                      <p><strong>1 registro/dia</strong> (resumo das 96 medições)</p>

                      <p><strong>Exemplo de dia:</strong></p>
                      <div className="data-example">
                        <code>
                          2025-01-15 → 
                          <br/>&nbsp;&nbsp;Temp Média: 23.2°C
                          <br/>&nbsp;&nbsp;Temp Mín: 21.8°C
                          <br/>&nbsp;&nbsp;Temp Máx: 24.5°C
                          <br/>&nbsp;&nbsp;Chuva Máx: 18.9mm
                          <br/>&nbsp;&nbsp;Bateria Média: 13.1V
                          <br/>&nbsp;&nbsp;Total Medições: 96
                        </code>
                      </div>

                      <p><strong>Quando usar?</strong></p>
                      <ul>
                        <li>✅ Visão geral de períodos longos</li>
                        <li>✅ Comparações mensais/anuais</li>
                        <li>✅ Gráficos de tendências</li>
                        <li>✅ Relatórios executivos</li>
                      </ul>

                      <p><strong>Campos calculados (7):</strong></p>
                      <ul className="field-list">
                        <li>Data (dia)</li>
                        <li>Chuva Máxima</li>
                        <li>Temperatura Média</li>
                        <li>Temperatura Mínima</li>
                        <li>Temperatura Máxima</li>
                        <li>Bateria Média</li>
                        <li>Total de Medições</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="processing-flow">
                  <h5>⚙️ Processo de Agregação</h5>
                  <div className="flow-diagram">
                    <div className="flow-box">
                      <strong>96 medições</strong>
                      <br/>a cada 15 min
                    </div>
                    <div className="flow-arrow">→</div>
                    <div className="flow-box">
                      <strong>SQL GROUP BY</strong>
                      <br/>DATE(data)
                    </div>
                    <div className="flow-arrow">→</div>
                    <div className="flow-box">
                      <strong>Funções</strong>
                      <br/>MAX, AVG, MIN, COUNT
                    </div>
                    <div className="flow-arrow">→</div>
                    <div className="flow-box">
                      <strong>1 registro</strong>
                      <br/>consolidado
                    </div>
                  </div>

                  <div className="formula-box">
                    <strong>SQL Completo de Agregação:</strong>
                    <code>
                      SELECT 
                      <br/>&nbsp;&nbsp;DATE("Data_Hora_Medicao") as dia,
                      <br/>&nbsp;&nbsp;COUNT(*) as total_medicoes,
                      <br/>&nbsp;&nbsp;MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
                      <br/>&nbsp;&nbsp;AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
                      <br/>&nbsp;&nbsp;MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
                      <br/>&nbsp;&nbsp;MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima,
                      <br/>&nbsp;&nbsp;AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
                      <br/>FROM "SerieTelemetrica"
                      <br/>WHERE codigoestacao = '75650010'
                      <br/>&nbsp;&nbsp;AND TO_CHAR("Data_Hora_Medicao", 'YYYY-MM') = '2025-01'
                      <br/>GROUP BY DATE("Data_Hora_Medicao")
                      <br/>ORDER BY dia DESC
                    </code>
                  </div>
                </div>

                <div className="info-box">
                  <h5>🎯 Qual usar?</h5>
                  <ul>
                    <li><strong>Dados Brutos:</strong> Quando precisar de detalhes minuto a minuto</li>
                    <li><strong>Dados Agregados:</strong> Para visualização e comparações gerais</li>
                  </ul>
                  <p>
                    💡 <strong>Dica:</strong> Comece pelos dados agregados para ter visão geral, 
                    depois consulte os brutos quando encontrar algo interessante!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="explainer-footer">
        <p>
          💡 <strong>Dica:</strong> Todas as análises são atualizadas automaticamente quando novos dados 
          são sincronizados da API da ANA.
        </p>
      </div>
    </div>
  )
}
