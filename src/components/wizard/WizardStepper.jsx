import { contarEscolhas } from '../../data/cardapioConfig.js'
import { usePedidoWizard } from '../../state/PedidoWizardContext.jsx'

/**
 * Barra das 9 etapas. Cada etapa já visitada vira um botão clicável, então dá
 * para pular direto para "Molho" e voltar sem passar por próximo/anterior.
 */
export default function WizardStepper() {
  const { etapas, indiceEtapa, etapasVisitadas, irParaEtapa, escolhas } = usePedidoWizard()

  const progresso = (indiceEtapa / (etapas.length - 1)) * 100

  return (
    <nav className="stepper" aria-label="Etapas da montagem do pedido">
      <div className="stepper__trilho" aria-hidden="true">
        <div className="stepper__progresso" style={{ width: `${progresso}%` }} />
      </div>

      <ol className="stepper__lista">
        {etapas.map((etapa, indice) => {
          const visitada = etapasVisitadas.has(etapa.id)
          const atual = indice === indiceEtapa
          const concluida = visitada && indice < indiceEtapa
          const quantidade = etapa.tipo === 'revisao' ? 0 : contarEscolhas(etapa, escolhas)

          const classes = [
            'stepper__item',
            atual && 'stepper__item--atual',
            concluida && 'stepper__item--concluida',
            !visitada && 'stepper__item--bloqueada',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <li key={etapa.id} className={classes}>
              <button
                type="button"
                className="stepper__botao"
                onClick={() => irParaEtapa(indice)}
                disabled={!visitada}
                aria-current={atual ? 'step' : undefined}
                title={
                  visitada
                    ? `Ir para ${etapa.titulo}`
                    : `${etapa.titulo} — disponível depois de passar por aqui`
                }
              >
                <span className="stepper__numero">
                  {concluida ? '✓' : indice + 1}
                </span>
                <span className="stepper__rotulo">
                  <span className="stepper__icone" aria-hidden="true">
                    {etapa.icone}
                  </span>
                  {etapa.titulo}
                </span>
                {quantidade > 1 && (
                  <span className="stepper__badge" title={`${quantidade} itens`}>
                    {quantidade}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
