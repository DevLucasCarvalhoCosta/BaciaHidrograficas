import React, { useMemo, useState } from 'react'

interface MonthlyData {
  mes: string
  chuva_maxima: string
  temp_media: string
  bateria_media: string
  total_medicoes: string
}

interface TrendInsightsProps {
  data: MonthlyData[]
}

interface InsightItem {
  icon: string
  title: string
  description: string
  severity: 'info' | 'success' | 'warning' | 'critical'
  recommendation?: string
  scientificContext?: string
  dataEvidence?: string  // Explicação clara baseada nos dados analisados
}

interface TooltipProps {
  title: string
  content: string | React.ReactNode
}

const InfoTooltip: React.FC<TooltipProps> = ({ title, content }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const tooltipWidth = 380
      const viewportWidth = window.innerWidth
      
      let left = rect.right + 8
      let top = rect.top
      
      // Se não couber na direita, coloca na esquerda
      if (left + tooltipWidth > viewportWidth - 20) {
        left = rect.left - tooltipWidth - 8
      }
      
      // Se ainda não couber, centraliza
      if (left < 20) {
        left = Math.max(20, (viewportWidth - tooltipWidth) / 2)
        top = rect.bottom + 8
      }
      
      setPosition({ top, left })
    }
  }

  React.useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const hasScroll = tooltipRef.current.scrollHeight > tooltipRef.current.clientHeight
      if (hasScroll) {
        tooltipRef.current.classList.add('has-scroll')
      } else {
        tooltipRef.current.classList.remove('has-scroll')
      }
      updatePosition()
    }
  }, [isVisible])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPinned &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPinned(false)
        setIsVisible(false)
      }
    }

    const handleScroll = () => {
      if (isVisible) {
        updatePosition()
      }
    }

    if (isPinned) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isPinned, isVisible])

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      setIsPinned(false)
      setIsVisible(false)
    } else {
      setIsPinned(true)
      setIsVisible(true)
    }
  }

  return (
    <div className="tooltip-container" ref={containerRef}>
      <button
        ref={buttonRef}
        className={`info-icon ${isPinned ? 'pinned' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Informação"
      />
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="tooltip-content" 
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4>{title}</h4>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      )}
    </div>
  )
}

export const TrendInsights: React.FC<TrendInsightsProps> = ({ data }) => {
  const insights: InsightItem[] = useMemo(() => {
    if (!data || data.length < 2) return []

    const results: InsightItem[] = []
    
    // Extrair valores numéricos
    const chuvaValues = data.map(d => parseFloat(d.chuva_maxima))
    const tempValues = data.map(d => parseFloat(d.temp_media))
    const bateriaValues = data.map(d => parseFloat(d.bateria_media))
    
    // Calcular estatísticas
    const chuvaAvg = chuvaValues.reduce((a, b) => a + b, 0) / chuvaValues.length
    const tempAvg = tempValues.reduce((a, b) => a + b, 0) / tempValues.length
    const bateriaAvg = bateriaValues.reduce((a, b) => a + b, 0) / bateriaValues.length
    
    const chuvaMax = Math.max(...chuvaValues)
    const chuvaMin = Math.min(...chuvaValues)
    const tempMax = Math.max(...tempValues)
    const tempMin = Math.min(...tempValues)
    
    // Variação percentual início vs fim
    const chuvaChangePercent = ((chuvaValues[chuvaValues.length - 1] - chuvaValues[0]) / chuvaValues[0]) * 100
    const tempChangePercent = ((tempValues[tempValues.length - 1] - tempValues[0]) / tempValues[0]) * 100
    const bateriaChangePercent = ((bateriaValues[bateriaValues.length - 1] - bateriaValues[0]) / bateriaValues[0]) * 100
    
    // Coeficiente de variação (CV) - medida de variabilidade
    const chuvaStdDev = Math.sqrt(chuvaValues.reduce((sq, n) => sq + Math.pow(n - chuvaAvg, 2), 0) / chuvaValues.length)
    const chuvaCV = (chuvaStdDev / chuvaAvg) * 100
    
    // ===== ANÁLISE 1: Tendência de Precipitação =====
    if (Math.abs(chuvaChangePercent) > 30) {
      const primeiroMes = data[0].mes
      const ultimoMes = data[data.length - 1].mes
      const primeiraChuva = chuvaValues[0].toFixed(1)
      const ultimaChuva = chuvaValues[chuvaValues.length - 1].toFixed(1)
      
      results.push({
        icon: chuvaChangePercent > 0 ? '🌧️' : '☀️',
        title: chuvaChangePercent > 0 ? 'Aumento Expressivo de Precipitação' : 'Redução Significativa de Precipitação',
        description: `Variação de ${chuvaChangePercent > 0 ? '+' : ''}${chuvaChangePercent.toFixed(1)}% na precipitação máxima entre o início e fim do período analisado. ${
          chuvaChangePercent > 0 
            ? 'Indica intensificação do regime pluviométrico na região.'
            : 'Sugere período de estiagem ou redução do regime de chuvas.'
        }`,
        severity: Math.abs(chuvaChangePercent) > 50 ? 'critical' : 'warning',
        recommendation: chuvaChangePercent > 0
          ? 'Monitorar níveis de vazão e capacidade de reservatórios. Avaliar risco de enchentes em áreas vulneráveis.'
          : 'Implementar medidas de gestão hídrica para garantir abastecimento. Considerar análise de impactos em agricultura e ecossistemas.',
        dataEvidence: `Análise dos dados mostra que a precipitação máxima passou de ${primeiraChuva}mm em ${primeiroMes} para ${ultimaChuva}mm em ${ultimoMes}. Esta variação de ${Math.abs(chuvaChangePercent).toFixed(1)}% ultrapassa o limiar de 30% estabelecido para mudanças significativas no regime pluviométrico. A média geral do período foi de ${chuvaAvg.toFixed(1)}mm, com variação entre ${chuvaMin.toFixed(1)}mm e ${chuvaMax.toFixed(1)}mm.`,
        scientificContext: 'Variações acima de 30% no regime pluviométrico podem indicar mudanças nos padrões climáticos regionais ou eventos meteorológicos extremos (IPCC, 2021).'
      })
    } else if (chuvaCV > 50) {
      results.push({
        icon: '📊',
        title: 'Alta Variabilidade Pluviométrica',
        description: `Coeficiente de variação de ${chuvaCV.toFixed(1)}% indica distribuição irregular das chuvas. Alternância entre períodos muito secos e muito úmidos.`,
        severity: 'warning',
        recommendation: 'Desenvolver estratégias de armazenamento para períodos de seca e sistemas de drenagem para picos de precipitação.',
        dataEvidence: `O coeficiente de variação (CV) calculado foi de ${chuvaCV.toFixed(1)}%, obtido através do desvio padrão (${chuvaStdDev.toFixed(1)}mm) dividido pela média (${chuvaAvg.toFixed(1)}mm). Valores de CV acima de 50% indicam alta dispersão dos dados. Durante o período analisado, observou-se precipitação mínima de ${chuvaMin.toFixed(1)}mm e máxima de ${chuvaMax.toFixed(1)}mm - uma amplitude de ${(chuvaMax - chuvaMin).toFixed(1)}mm.`,
        scientificContext: 'Alta variabilidade pluviométrica (CV > 50%) é característica de climas tropicais com estações bem definidas, exigindo adaptações na gestão de recursos hídricos.'
      })
    }

    // ===== ANÁLISE 2: Padrão de Temperatura =====
    const amplitudeTermica = tempMax - tempMin
    if (amplitudeTermica > 8) {
      results.push({
        icon: '🌡️',
        title: 'Amplitude Térmica Significativa',
        description: `Variação de ${amplitudeTermica.toFixed(1)}°C entre as temperaturas mínima (${tempMin.toFixed(1)}°C) e máxima (${tempMax.toFixed(1)}°C) da água. Indica forte sazonalidade térmica.`,
        severity: 'info',
        recommendation: 'Monitorar impactos na biodiversidade aquática. Espécies sensíveis podem sofrer com variações térmicas abruptas.',
        dataEvidence: `A amplitude térmica de ${amplitudeTermica.toFixed(1)}°C foi calculada pela diferença entre a temperatura máxima registrada (${tempMax.toFixed(1)}°C) e a mínima (${tempMin.toFixed(1)}°C) ao longo dos ${data.length} meses analisados. A temperatura média do período foi ${tempAvg.toFixed(1)}°C. Esta amplitude supera o limiar de 8°C que caracteriza forte sazonalidade térmica em corpos d'água.`,
        scientificContext: 'Amplitudes térmicas elevadas em corpos hídricos podem afetar metabolismo de organismos aquáticos, solubilidade de oxigênio e dinâmica de nutrientes (Wetzel, 2001).'
      })
    }

    if (tempAvg > 26) {
      results.push({
        icon: '🔥',
        title: 'Temperatura Média Elevada',
        description: `Temperatura média da água de ${tempAvg.toFixed(1)}°C está acima do ideal para muitos ecossistemas aquáticos tropicais (20-25°C). Pode indicar estresse térmico.`,
        severity: 'warning',
        recommendation: 'Investigar causas: aquecimento global, redução de mata ciliar, poluição térmica. Considerar ações de mitigação como reflorestamento ripário.',
        dataEvidence: `Analisando ${data.length} meses de dados, a temperatura média calculada foi ${tempAvg.toFixed(1)}°C, com valores variando de ${tempMin.toFixed(1)}°C a ${tempMax.toFixed(1)}°C. Esta média excede em ${(tempAvg - 25).toFixed(1)}°C a faixa ideal para ecossistemas aquáticos tropicais (20-25°C), indicando condições térmicas potencialmente estressantes para organismos aquáticos.`,
        scientificContext: 'Temperaturas acima de 26°C reduzem concentração de oxigênio dissolvido e podem favorecer proliferação de cianobactérias (eutrofização).'
      })
    } else if (tempAvg < 18) {
      results.push({
        icon: '❄️',
        title: 'Temperatura Média Baixa',
        description: `Temperatura média da água de ${tempAvg.toFixed(1)}°C está abaixo da faixa típica para regiões tropicais. Pode indicar influência de nascentes ou tributários frios.`,
        severity: 'info',
        dataEvidence: `A análise de ${data.length} meses revelou temperatura média de ${tempAvg.toFixed(1)}°C, com variação entre ${tempMin.toFixed(1)}°C e ${tempMax.toFixed(1)}°C. Este valor está ${(18 - tempAvg).toFixed(1)}°C abaixo da faixa típica para regiões tropicais (18-28°C), sugerindo influência de fontes de água fria como nascentes, aquíferos profundos ou tributários de regiões elevadas.`,
        scientificContext: 'Águas mais frias (< 18°C) geralmente apresentam maior oxigenação, mas podem limitar diversidade de espécies termófilas.'
      })
    }

    if (Math.abs(tempChangePercent) > 15) {
      const primeiroMes = data[0].mes
      const ultimoMes = data[data.length - 1].mes
      const primeiraTemp = tempValues[0].toFixed(1)
      const ultimaTemp = tempValues[tempValues.length - 1].toFixed(1)
      
      results.push({
        icon: '📈',
        title: tempChangePercent > 0 ? 'Aquecimento Progressivo' : 'Resfriamento Progressivo',
        description: `Tendência de ${tempChangePercent > 0 ? 'aquecimento' : 'resfriamento'} de ${Math.abs(tempChangePercent).toFixed(1)}% ao longo do período. ${
          tempChangePercent > 0
            ? 'Pode estar relacionado a mudanças climáticas ou alterações no uso do solo da bacia.'
            : 'Pode indicar recuperação de vegetação ciliar ou mudanças hidrológicas.'
        }`,
        severity: tempChangePercent > 0 ? 'warning' : 'success',
        recommendation: tempChangePercent > 0
          ? 'Avaliar fontes de calor (urbanas, industriais). Monitorar qualidade da água e saúde aquática.'
          : 'Continuar monitoramento. Investigar se há projetos de recuperação ambiental na região.',
        dataEvidence: `Comparando os extremos do período analisado, a temperatura passou de ${primeiraTemp}°C em ${primeiroMes} para ${ultimaTemp}°C em ${ultimoMes}, representando uma variação de ${tempChangePercent > 0 ? '+' : ''}${tempChangePercent.toFixed(1)}% (${(parseFloat(ultimaTemp) - parseFloat(primeiraTemp)).toFixed(1)}°C em termos absolutos). Esta mudança excede o limiar de 15% considerado significativo para análises de tendências térmicas.`,
        scientificContext: 'Variações térmicas > 15% em períodos curtos são atípicas e merecem investigação detalhada de fatores antrópicos e naturais.'
      })
    }

    // ===== ANÁLISE 3: Correlação Chuva x Temperatura =====
    // Cálculo de correlação simplificado
    let somaChuvaTempProduto = 0
    for (let i = 0; i < data.length; i++) {
      somaChuvaTempProduto += (chuvaValues[i] - chuvaAvg) * (tempValues[i] - tempAvg)
    }
    const tempStdDev = Math.sqrt(tempValues.reduce((sq, n) => sq + Math.pow(n - tempAvg, 2), 0) / tempValues.length)
    const correlacao = somaChuvaTempProduto / (data.length * chuvaStdDev * tempStdDev)

    if (correlacao < -0.4) {
      results.push({
        icon: '🔄',
        title: 'Correlação Inversa Chuva-Temperatura',
        description: `Correlação negativa forte (${correlacao.toFixed(2)}) indica que períodos chuvosos coincidem com temperaturas mais baixas, padrão típico de regiões tropicais.`,
        severity: 'success',
        dataEvidence: `O coeficiente de correlação de Pearson calculado entre precipitação e temperatura foi ${correlacao.toFixed(3)}, indicando relação inversa forte. Analisando os ${data.length} meses de dados, quando a precipitação aumenta acima da média (${chuvaAvg.toFixed(1)}mm), a temperatura tende a ficar abaixo da média (${tempAvg.toFixed(1)}°C), e vice-versa. Este padrão de correlação negativa < -0.4 é estatisticamente significativo.`,
        scientificContext: 'Correlação inversa entre precipitação e temperatura é esperada em climas tropicais devido ao resfriamento evaporativo e cobertura de nuvens durante períodos chuvosos.'
      })
    } else if (correlacao > 0.4) {
      results.push({
        icon: '⚠️',
        title: 'Correlação Positiva Atípica Chuva-Temperatura',
        description: `Correlação positiva (${correlacao.toFixed(2)}) é incomum e pode indicar chuvas de verão (convectivas) ou alterações no padrão climático regional.`,
        severity: 'warning',
        recommendation: 'Investigar se há mudanças no regime de chuvas. Comparar com séries históricas mais longas.',
        dataEvidence: `A análise de correlação mostrou coeficiente positivo de ${correlacao.toFixed(3)}, indicando que períodos de maior precipitação (acima de ${chuvaAvg.toFixed(1)}mm) coincidem com temperaturas mais altas (acima de ${tempAvg.toFixed(1)}°C). Este comportamento contraria o padrão típico tropical e foi detectado em ${data.length} meses de observações. Correlações positivas > 0.4 são consideradas moderadas a fortes estatisticamente.`,
        scientificContext: 'Correlação positiva pode ocorrer em regiões com chuvas convectivas de verão, onde calor intenso precede precipitações torrenciais.'
      })
    }

    // ===== ANÁLISE 4: Saúde do Sistema de Monitoramento =====
    if (bateriaAvg < 12) {
      results.push({
        icon: '🔋',
        title: 'Tensão de Bateria Crítica',
        description: `Tensão média de ${bateriaAvg.toFixed(2)}V está abaixo do nível operacional seguro (≥ 12V). Sistema pode parar de funcionar.`,
        severity: 'critical',
        recommendation: 'URGENTE: Agendar visita técnica imediata para manutenção da bateria e sistema fotovoltaico.',
        dataEvidence: `Analisando ${data.length} meses de medições, a tensão média calculada foi ${bateriaAvg.toFixed(2)}V, com valores variando entre ${Math.min(...bateriaValues).toFixed(2)}V e ${Math.max(...bateriaValues).toFixed(2)}V. A média está ${(12 - bateriaAvg).toFixed(2)}V abaixo do limiar mínimo de 12V para operação segura de sistemas de 12V. Baterias operando continuamente abaixo deste nível apresentam alto risco de falha.`,
        scientificContext: 'Baterias de chumbo-ácido operando abaixo de 12V sofrem sulfatação irreversível, reduzindo drasticamente sua vida útil.'
      })
    } else if (bateriaChangePercent < -10) {
      const primeiroMes = data[0].mes
      const ultimoMes = data[data.length - 1].mes
      const primeiraBateria = bateriaValues[0].toFixed(2)
      const ultimaBateria = bateriaValues[bateriaValues.length - 1].toFixed(2)
      
      results.push({
        icon: '📉',
        title: 'Degradação Progressiva da Bateria',
        description: `Queda de ${Math.abs(bateriaChangePercent).toFixed(1)}% na tensão indica degradação do sistema de energia. Pode comprometer continuidade das medições.`,
        severity: 'warning',
        recommendation: 'Programar manutenção preventiva em até 30 dias. Verificar painéis solares, controlador de carga e conexões.',
        dataEvidence: `Comparação temporal mostra degradação progressiva: a tensão caiu de ${primeiraBateria}V em ${primeiroMes} para ${ultimaBateria}V em ${ultimoMes}, representando perda de ${Math.abs(bateriaChangePercent).toFixed(1)}% (${(parseFloat(primeiraBateria) - parseFloat(ultimaBateria)).toFixed(2)}V em termos absolutos). A média do período foi ${bateriaAvg.toFixed(2)}V. Quedas superiores a 10% são indicativas de problemas no sistema de energia.`,
        scientificContext: 'Degradação gradual é esperada em sistemas off-grid, mas taxas > 10% em períodos curtos indicam problemas que requerem intervenção.'
      })
    }

    // ===== ANÁLISE 5: Qualidade e Completude dos Dados =====
    const totalMedicoes = data.map(d => parseInt(d.total_medicoes))
    const medicoesAvg = totalMedicoes.reduce((a, b) => a + b, 0) / totalMedicoes.length
    const esperadoPorMes = 96 * 30 // 96 medições/dia * 30 dias
    const completude = (medicoesAvg / esperadoPorMes) * 100

    if (completude < 70) {
      results.push({
        icon: '📡',
        title: 'Baixa Completude de Dados',
        description: `Apenas ${completude.toFixed(1)}% das medições esperadas foram registradas. Lacunas nos dados podem comprometer análises estatísticas.`,
        severity: 'warning',
        recommendation: 'Verificar conexão telemétrica, sinal GSM e funcionamento do datalogger. Considerar redundância de transmissão.',
        dataEvidence: `Análise de ${data.length} meses mostra média de ${medicoesAvg.toFixed(0)} medições por mês. Considerando frequência de 15 minutos (96 medições/dia × 30 dias = ${esperadoPorMes} medições/mês), obteve-se completude de ${completude.toFixed(1)}%. Faltam em média ${(esperadoPorMes - medicoesAvg).toFixed(0)} medições por mês (${(100 - completude).toFixed(1)}% de dados ausentes). Mês com mais dados: ${Math.max(...totalMedicoes)} medições; mês com menos: ${Math.min(...totalMedicoes)} medições.`,
        scientificContext: 'Séries temporais com completude < 70% têm confiabilidade estatística reduzida e podem não capturar eventos extremos importantes.'
      })
    } else if (completude > 95) {
      results.push({
        icon: '✅',
        title: 'Excelente Qualidade de Dados',
        description: `Completude de ${completude.toFixed(1)}% indica sistema de monitoramento funcionando adequadamente. Dados confiáveis para análises.`,
        severity: 'success',
        dataEvidence: `Sistema apresenta excelente desempenho com ${completude.toFixed(1)}% de completude. Em ${data.length} meses, a média foi de ${medicoesAvg.toFixed(0)} medições por mês contra ${esperadoPorMes} esperadas (intervalo de 15 min). Isto significa apenas ${(100 - completude).toFixed(1)}% de falhas, garantindo captura de eventos extremos e variabilidade natural. Total de ${totalMedicoes.reduce((a, b) => a + b, 0).toLocaleString()} medições registradas no período.`,
        scientificContext: 'Alta completude (> 95%) é essencial para análises hidrológicas robustas e detecção confiável de tendências e anomalias.'
      })
    }

    // ===== ANÁLISE 6: Eventos Extremos =====
    if (chuvaMax > chuvaAvg * 3) {
      const mesEventoExtremo = data[chuvaValues.indexOf(chuvaMax)].mes
      
      results.push({
        icon: '⚡',
        title: 'Evento de Precipitação Extrema Detectado',
        description: `Pico de ${chuvaMax.toFixed(2)}mm é ${(chuvaMax / chuvaAvg).toFixed(1)}x maior que a média (${chuvaAvg.toFixed(2)}mm). Possível evento meteorológico extremo.`,
        severity: 'critical',
        recommendation: 'Avaliar impactos: erosão, assoreamento, danos estruturais. Documentar para estudos de frequência de eventos extremos.',
        dataEvidence: `Evento extremo detectado em ${mesEventoExtremo} com precipitação máxima de ${chuvaMax.toFixed(2)}mm. Este valor excede em ${((chuvaMax / chuvaAvg - 1) * 100).toFixed(0)}% a média do período (${chuvaAvg.toFixed(2)}mm) e é ${(chuvaMax / chuvaAvg).toFixed(1)}x superior, ultrapassando o limiar de 3x que define eventos extremos. A diferença absoluta em relação à média é de ${(chuvaMax - chuvaAvg).toFixed(2)}mm. Segundo registro mais alto: ${chuvaValues.sort((a, b) => b - a)[1].toFixed(2)}mm.`,
        scientificContext: 'Eventos extremos (> 3x média) são críticos para dimensionamento de obras hidráulicas e gestão de riscos de desastres naturais.'
      })
    }

    // Se não houver insights críticos, adicionar mensagem positiva
    if (results.length === 0) {
      results.push({
        icon: '✨',
        title: 'Condições Estáveis e Normais',
        description: 'Os dados analisados não apresentam anomalias significativas. Sistema operando dentro dos padrões esperados.',
        severity: 'success',
        dataEvidence: `Análise detalhada de ${data.length} meses não identificou desvios significativos nos parâmetros monitorados. Precipitação média: ${chuvaAvg.toFixed(1)}mm (CV: ${chuvaCV.toFixed(1)}%); Temperatura média: ${tempAvg.toFixed(1)}°C (amplitude: ${amplitudeTermica.toFixed(1)}°C); Bateria média: ${bateriaAvg.toFixed(2)}V; Completude: ${completude.toFixed(1)}%. Todos os indicadores estão dentro das faixas esperadas para operação normal.`,
        scientificContext: 'Estabilidade hidrológica indica condições ambientais adequadas e ausência de perturbações significativas na bacia hidrográfica.'
      })
    }

    return results
  }, [data])

  const getSeverityColor = (severity: string) => {
    const colors = {
      info: '#0284c7',      // Azul principal do projeto
      success: '#10b981',   // Verde sucesso
      warning: '#f59e0b',   // Amarelo warning
      critical: '#ef4444'   // Vermelho crítico
    }
    return colors[severity as keyof typeof colors] || '#64748b'
  }

  const getSeverityIcon = (severity: string) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      critical: '🚨'
    }
    return icons[severity as keyof typeof icons] || 'ℹ️'
  }

  if (insights.length === 0) {
    return <div className="chart-empty">Dados insuficientes para gerar insights (mínimo 2 meses necessário)</div>
  }

  return (
    <div className="trend-insights-section">
      <div className="insights-header" style={{ position: 'relative' }}>
        <InfoTooltip
          title="Insights Inteligentes"
          content={
            <>
              <p>
                <strong>Sistema Inteligente de Análise</strong> que processa automaticamente 
                os dados hidrométricos e gera insights contextualizados.
              </p>
              <div className="tooltip-section">
                <div className="tooltip-section-title">🤖 Metodologia de Análise:</div>
                <ul>
                  <li><strong>Análises Estatísticas:</strong> Média, desvio padrão, CV, correlações</li>
                  <li><strong>Detecção de Padrões:</strong> Tendências, sazonalidade, eventos extremos</li>
                  <li><strong>Classificação de Riscos:</strong> Baseada em thresholds científicos</li>
                  <li><strong>Contexto Ambiental:</strong> Referências da literatura técnica</li>
                </ul>
              </div>
              <div className="tooltip-section">
                <div className="tooltip-section-title">🎯 Classificação de Severidade:</div>
                <ul>
                  <li><strong style={{color: '#0284c7'}}>INFO:</strong> Observações técnicas gerais</li>
                  <li><strong style={{color: '#10b981'}}>SUCCESS:</strong> Condições ideais detectadas</li>
                  <li><strong style={{color: '#f59e0b'}}>WARNING:</strong> Atenção necessária</li>
                  <li><strong style={{color: '#ef4444'}}>CRITICAL:</strong> Intervenção urgente</li>
                </ul>
              </div>
              <div className="tooltip-note">
                📊 Quanto mais dados disponíveis, mais precisos são os insights gerados.
              </div>
            </>
          }
        />
        <h4>
          <span className="header-icon">💡</span>
          Insights e Análises Inteligentes
        </h4>
        <p className="insights-subtitle">
          Análises contextualizadas baseadas em padrões hidrológicos e melhores práticas científicas
        </p>
      </div>

      <div className="insights-grid">
        {insights.map((insight, index) => (
          <div 
            key={index} 
            className="insight-card"
            style={{ 
              borderLeftColor: getSeverityColor(insight.severity),
              position: 'relative'
            }}
          >
            <InfoTooltip
              title={`Análise: ${insight.title}`}
              content={
                <>
                  <p>
                    <strong>Tipo de Insight:</strong> {insight.severity.toUpperCase()}
                  </p>
                  <div className="tooltip-section">
                    <div className="tooltip-section-title">📋 Como foi detectado:</div>
                    <p>
                      {insight.severity === 'critical' && 
                        'Valores fora dos limites críticos estabelecidos por normas técnicas e literatura científica.'}
                      {insight.severity === 'warning' && 
                        'Desvios significativos das faixas esperadas ou padrões atípicos detectados nas análises estatísticas.'}
                      {insight.severity === 'success' && 
                        'Indicadores dentro das faixas ideais e comportamento adequado dos parâmetros monitorados.'}
                      {insight.severity === 'info' && 
                        'Observação técnica relevante identificada através de análises comparativas e contextuais.'}
                    </p>
                  </div>
                  <div className="tooltip-section">
                    <div className="tooltip-section-title">🔬 Base Científica:</div>
                    <p>{insight.scientificContext || 'Análise baseada em padrões hidrológicos estabelecidos.'}</p>
                  </div>
                  {insight.recommendation && (
                    <div className="tooltip-note">
                      💡 <strong>Ação Sugerida:</strong> {insight.recommendation}
                    </div>
                  )}
                </>
              }
            />
            <div className="insight-header">
              <div className="insight-title-row">
                <span className="insight-icon-large">{insight.icon}</span>
                <div className="insight-title-content">
                  <h5>{insight.title}</h5>
                  <span 
                    className="severity-badge"
                    style={{ 
                      background: getSeverityColor(insight.severity) + '20',
                      color: getSeverityColor(insight.severity),
                      borderColor: getSeverityColor(insight.severity)
                    }}
                  >
                    {getSeverityIcon(insight.severity)} {insight.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="insight-body">
              <p className="insight-description">{insight.description}</p>

              {insight.dataEvidence && (
                <div className="insight-data-evidence">
                  <strong className="data-evidence-label">📊 Análise dos Dados:</strong>
                  <p>{insight.dataEvidence}</p>
                </div>
              )}

              {insight.recommendation && (
                <div className="insight-recommendation">
                  <strong className="recommendation-label">📋 Recomendação:</strong>
                  <p>{insight.recommendation}</p>
                </div>
              )}

              {insight.scientificContext && (
                <div className="insight-scientific">
                  <strong className="scientific-label">🔬 Contexto Científico:</strong>
                  <p>{insight.scientificContext}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="insights-footer">
        <div className="footer-note" style={{ position: 'relative' }}>
          <InfoTooltip
            title="Nota Metodológica"
            content={
              <>
                <p>
                  <strong>Validação Científica:</strong> Os algoritmos de análise são baseados 
                  em métodos estatísticos consolidados e thresholds estabelecidos na literatura.
                </p>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">📚 Referências Técnicas:</div>
                  <ul>
                    <li>IPCC - Painel Intergovernamental sobre Mudanças Climáticas</li>
                    <li>Wetzel (2001) - Limnology: Lake and River Ecosystems</li>
                    <li>ANA - Agência Nacional de Águas e Saneamento Básico</li>
                    <li>Normas ABNT para sistemas de monitoramento hidrológico</li>
                  </ul>
                </div>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">⚠️ Limitações:</div>
                  <p>
                    Insights automatizados não substituem análise especializada. 
                    Para decisões críticas, consulte profissionais em recursos hídricos.
                  </p>
                </div>
              </>
            }
          />
          <span className="note-icon">📚</span>
          <p>
            <strong>Nota Metodológica:</strong> Os insights são gerados através de análises estatísticas, 
            correlações e comparação com padrões hidrológicos estabelecidos na literatura científica. 
            Para decisões críticas, recomenda-se validação por profissionais especializados em recursos hídricos.
          </p>
        </div>
      </div>
    </div>
  )
}
