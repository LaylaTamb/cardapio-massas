import { useState } from 'react'
import EtapaSelecaoMultipla from '../components/wizard/EtapaSelecaoMultipla.jsx'
import EtapaSelecaoUnica from '../components/wizard/EtapaSelecaoUnica.jsx'
import PratoPreview from '../components/wizard/PratoPreview.jsx'
import ResumoPedido from '../components/wizard/ResumoPedido.jsx'
import WizardStepper from '../components/wizard/WizardStepper.jsx'
import { usePedidoWizard } from '../state/PedidoWizardContext.jsx'
import { usePedidos } from '../state/PedidosContext.jsx'

/** Aba "Montar pedido": hospeda o wizard de 9 etapas. */
export default function CardapioPage({ onIrParaPedidos }) {
  const {
    etapa,
    indiceEtapa,
    etapas,
    indiceRevisao,
    avancar,
    voltar,
    irParaEtapa,
    iniciarNovoPedido,
    edicao,
    cancelarEdicao,
    escolhas,
  } = usePedidoWizard()

  const { pastas, adicionarPedido, atualizarPedido } = usePedidos()
  const [ultimoSalvo, setUltimoSalvo] = useState(null)

  const naRevisao = etapa.tipo === 'revisao'
  const ultimaEtapaDeEscolha = indiceEtapa === indiceRevisao - 1

  function salvar({ nome, pastaId }) {
    if (edicao) {
      atualizarPedido(edicao.id, { nome, pastaId, escolhas })
      setUltimoSalvo({ nome, editado: true })
      cancelarEdicao()
    } else {
      adicionarPedido({ nome, pastaId, escolhas })
      setUltimoSalvo({ nome, editado: false })
    }
  }

  function montarOutro() {
    setUltimoSalvo(null)
    iniciarNovoPedido()
  }

  if (ultimoSalvo) {
    return (
      <div className="confirmacao">
        <span className="confirmacao__icone" aria-hidden="true">
          🍝
        </span>
        <h2>
          {ultimoSalvo.editado ? 'Pedido atualizado!' : 'Pedido salvo!'}
        </h2>
        <p>
          <strong>{ultimoSalvo.nome}</strong> está na sua lista de pedidos — ainda só na memória
          deste navegador. Use <em>Salvar e commitar no GitHub</em> quando quiser versionar.
        </p>
        <div className="confirmacao__acoes">
          <button type="button" className="botao botao--primario" onClick={montarOutro}>
            Montar outro pedido
          </button>
          <button
            type="button"
            className="botao botao--fantasma"
            onClick={() => {
              setUltimoSalvo(null)
              onIrParaPedidos()
            }}
          >
            Ver pedidos criados
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="cardapio">
      {edicao && (
        <div className="alerta alerta--info alerta--largo">
          Editando o pedido <strong>{edicao.nome}</strong>. As mudanças só valem quando você
          confirmar na etapa de Revisão.{' '}
          <button
            type="button"
            className="botao botao--texto"
            onClick={() => {
              cancelarEdicao()
              iniciarNovoPedido()
            }}
          >
            Cancelar edição
          </button>
        </div>
      )}

      <WizardStepper />

      <div className="cardapio__corpo">
        <main className="cardapio__etapa">
          {etapa.tipo === 'unica' && <EtapaSelecaoUnica etapa={etapa} />}
          {(etapa.tipo === 'contador' || etapa.tipo === 'multipla') && (
            <EtapaSelecaoMultipla etapa={etapa} />
          )}
          {naRevisao && (
            <ResumoPedido
              pastas={pastas}
              onSalvar={salvar}
              onDescartarEdicao={() => {
                cancelarEdicao()
                iniciarNovoPedido()
              }}
            />
          )}

          <div className="navegacao">
            <button
              type="button"
              className="botao botao--fantasma"
              onClick={voltar}
              disabled={indiceEtapa === 0}
            >
              ← Anterior
            </button>

            <span className="navegacao__posicao">
              Etapa {indiceEtapa + 1} de {etapas.length}
            </span>

            {naRevisao ? (
              <button
                type="button"
                className="botao botao--fantasma"
                onClick={() => irParaEtapa(0)}
              >
                Voltar ao início
              </button>
            ) : (
              <button type="button" className="botao botao--primario" onClick={avancar}>
                {ultimaEtapaDeEscolha ? 'Revisar pedido →' : 'Próxima etapa →'}
              </button>
            )}
          </div>
        </main>

        <PratoPreview />
      </div>
    </div>
  )
}
