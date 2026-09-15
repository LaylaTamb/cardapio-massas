import { ETAPAS_DE_ESCOLHA, descreverEscolha, sugerirNome } from '../../data/cardapioConfig.js'
import { usePedidoWizard } from '../../state/PedidoWizardContext.jsx'

/**
 * Preview incremental do prato: fica visível o tempo todo e vai ganhando linhas
 * conforme o usuário avança. Etapas ainda não alcançadas aparecem apagadas,
 * como um "a definir".
 */
export default function PratoPreview() {
  const { escolhas, indiceEtapa, etapasVisitadas, irParaEtapaPorId, etapas } = usePedidoWizard()

  const titulo = sugerirNome(escolhas)

  return (
    <aside className="preview" aria-label="Prato sendo montado">
      <div className="preview__topo">
        <span className="preview__selo">Montando</span>
        <h3 className="preview__titulo">{titulo}</h3>
      </div>

      <ul className="preview__lista">
        {ETAPAS_DE_ESCOLHA.map((etapa) => {
          const indice = etapas.findIndex((e) => e.id === etapa.id)
          const atual = indice === indiceEtapa
          const texto = descreverEscolha(etapa, escolhas)
          const visitada = etapasVisitadas.has(etapa.id)
          // "a definir" só para etapas que o usuário ainda não viu. Ao voltar
          // uma etapa (ou ao editar um pedido salvo) os valores seguintes já são
          // conhecidos e continuam à vista.
          const alcancada = indice <= indiceEtapa || visitada

          return (
            <li
              key={etapa.id}
              className={[
                'preview__linha',
                atual && 'preview__linha--atual',
                !alcancada && 'preview__linha--futura',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <button
                type="button"
                className="preview__atalho"
                onClick={() => irParaEtapaPorId(etapa.id)}
                disabled={!visitada}
                title={visitada ? `Ir para ${etapa.titulo}` : 'Ainda não visitada'}
              >
                <span className="preview__rotulo">
                  <span aria-hidden="true">{etapa.icone}</span> {etapa.titulo}
                </span>
                <span className="preview__valor">
                  {!alcancada ? (
                    <span className="preview__pendente">a definir</span>
                  ) : texto ? (
                    texto
                  ) : (
                    <span className="preview__pendente">nada selecionado</span>
                  )}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
