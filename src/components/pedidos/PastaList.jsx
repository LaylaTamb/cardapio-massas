import { useState } from 'react'
import { usePedidos } from '../../state/PedidosContext.jsx'
import PedidoCard from './PedidoCard.jsx'

// -----------------------------------------------------------------------------
// Lista de pastas + pedidos, com drag-and-drop nativo do HTML5.
//
// Dois tipos de arrasto convivem aqui:
//   - 'pedido' -> reordena dentro da pasta ou move para outra pasta
//   - 'pasta'  -> reordena as próprias pastas
// O estado `arrasto` diz qual está em curso, e cada alvo só aceita o seu tipo.
// -----------------------------------------------------------------------------

export default function PastaList({ onEditarPedido }) {
  const {
    pedidos,
    pastas,
    statusPorPedido,
    renomearPasta,
    removerPasta,
    reordenarPasta,
    reordenarPedido,
    removerPedido,
    duplicarPedido,
  } = usePedidos()

  const [arrasto, setArrasto] = useState(null)
  const [alvo, setAlvo] = useState(null)
  const [pastaEmEdicao, setPastaEmEdicao] = useState(null)
  const [nomeEmEdicao, setNomeEmEdicao] = useState('')

  // "Sem pasta" é um grupo fixo: não pode ser renomeado, movido nem excluído.
  const grupos = [{ id: null, nome: 'Sem pasta', fixa: true }, ...pastas]

  function limparArrasto() {
    setArrasto(null)
    setAlvo(null)
  }

  // --- arrasto de pedidos ---------------------------------------------------

  function iniciarArrastoPedido(evento, pedido) {
    setArrasto({ tipo: 'pedido', id: pedido.id })
    evento.dataTransfer.effectAllowed = 'move'
    evento.dataTransfer.setData('text/plain', pedido.id)
  }

  function sobreCard(evento, pedido) {
    if (arrasto?.tipo !== 'pedido') return
    evento.preventDefault()
    evento.stopPropagation()
    const caixa = evento.currentTarget.getBoundingClientRect()
    const posicao = evento.clientY - caixa.top < caixa.height / 2 ? 'antes' : 'depois'
    setAlvo({ tipo: 'pedido', id: pedido.id, posicao })
  }

  function soltarNoCard(evento, pedido) {
    if (arrasto?.tipo !== 'pedido') return
    evento.preventDefault()
    evento.stopPropagation()
    reordenarPedido({
      idArrastado: arrasto.id,
      pastaDestino: pedido.pastaId ?? null,
      idAlvo: pedido.id,
      posicao: alvo?.id === pedido.id ? alvo.posicao : 'antes',
    })
    limparArrasto()
  }

  // --- arrasto de pastas ----------------------------------------------------

  function iniciarArrastoPasta(evento, pasta) {
    setArrasto({ tipo: 'pasta', id: pasta.id })
    evento.dataTransfer.effectAllowed = 'move'
    evento.dataTransfer.setData('text/plain', pasta.id)
  }

  function sobreCabecalho(evento, grupo) {
    if (arrasto?.tipo !== 'pasta' || grupo.fixa) return
    evento.preventDefault()
    evento.stopPropagation()
    const caixa = evento.currentTarget.getBoundingClientRect()
    const posicao = evento.clientY - caixa.top < caixa.height / 2 ? 'antes' : 'depois'
    setAlvo({ tipo: 'pasta', id: grupo.id, posicao })
  }

  function soltarNoCabecalho(evento, grupo) {
    if (arrasto?.tipo !== 'pasta' || grupo.fixa) return
    evento.preventDefault()
    evento.stopPropagation()
    reordenarPasta({
      idArrastada: arrasto.id,
      idAlvo: grupo.id,
      posicao: alvo?.id === grupo.id ? alvo.posicao : 'antes',
    })
    limparArrasto()
  }

  // --- área do grupo (soltar um pedido no fim da pasta) ---------------------

  function sobreGrupo(evento, grupo) {
    if (arrasto?.tipo !== 'pedido') return
    evento.preventDefault()
    setAlvo({ tipo: 'grupo', id: grupo.id })
  }

  function soltarNoGrupo(evento, grupo) {
    if (arrasto?.tipo !== 'pedido') return
    evento.preventDefault()
    reordenarPedido({ idArrastado: arrasto.id, pastaDestino: grupo.id, idAlvo: null })
    limparArrasto()
  }

  // --- edição de nome da pasta ---------------------------------------------

  function comecarEdicao(pasta) {
    setPastaEmEdicao(pasta.id)
    setNomeEmEdicao(pasta.nome)
  }

  function confirmarEdicao(evento) {
    evento.preventDefault()
    if (pastaEmEdicao) renomearPasta(pastaEmEdicao, nomeEmEdicao)
    setPastaEmEdicao(null)
    setNomeEmEdicao('')
  }

  function excluirPasta(pasta, quantidade) {
    const aviso =
      quantidade > 0
        ? `Excluir a pasta "${pasta.nome}"? Os ${quantidade} pedido(s) dela voltam para "Sem pasta".`
        : `Excluir a pasta "${pasta.nome}"?`
    if (window.confirm(aviso)) removerPasta(pasta.id)
  }

  return (
    <div className="pastas">
      {grupos.map((grupo) => {
        const doGrupo = pedidos.filter((pedido) => (pedido.pastaId ?? null) === grupo.id)
        const grupoAlvo = alvo?.tipo === 'grupo' && alvo.id === grupo.id
        const pastaAlvo = alvo?.tipo === 'pasta' && alvo.id === grupo.id
        // Cuidado: o grupo fixo tem id null, então só compara quando há edição em curso.
        const emEdicao = !grupo.fixa && pastaEmEdicao === grupo.id

        // "Sem pasta" some da tela quando está vazia e existe pelo menos uma pasta.
        if (grupo.fixa && doGrupo.length === 0 && pastas.length > 0) return null

        return (
          <section
            key={grupo.id ?? 'sem-pasta'}
            className={[
              'pasta',
              grupo.fixa && 'pasta--fixa',
              grupoAlvo && 'pasta--alvo',
              arrasto?.tipo === 'pasta' && arrasto.id === grupo.id && 'pasta--arrastando',
              pastaAlvo && alvo.posicao === 'antes' && 'pasta--alvo-antes',
              pastaAlvo && alvo.posicao === 'depois' && 'pasta--alvo-depois',
            ]
              .filter(Boolean)
              .join(' ')}
            onDragOver={(evento) => sobreGrupo(evento, grupo)}
            onDrop={(evento) => soltarNoGrupo(evento, grupo)}
          >
            <header
              className="pasta__cabecalho"
              draggable={!grupo.fixa && !emEdicao}
              onDragStart={(evento) => !grupo.fixa && iniciarArrastoPasta(evento, grupo)}
              onDragEnd={limparArrasto}
              onDragOver={(evento) => sobreCabecalho(evento, grupo)}
              onDrop={(evento) => soltarNoCabecalho(evento, grupo)}
            >
              {emEdicao ? (
                <form className="pasta__edicao" onSubmit={confirmarEdicao}>
                  <input
                    className="campo"
                    value={nomeEmEdicao}
                    onChange={(evento) => setNomeEmEdicao(evento.target.value)}
                    autoFocus
                    maxLength={80}
                    aria-label="Novo nome da pasta"
                  />
                  <button type="submit" className="botao botao--pequeno botao--primario">
                    Salvar
                  </button>
                  <button
                    type="button"
                    className="botao botao--pequeno botao--fantasma"
                    onClick={() => setPastaEmEdicao(null)}
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <h3 className="pasta__nome">
                    {!grupo.fixa && (
                      <span className="pasta__pegador" aria-hidden="true" title="Arraste para reordenar as pastas">
                        ⠿
                      </span>
                    )}
                    <span aria-hidden="true">{grupo.fixa ? '📥' : '📁'}</span> {grupo.nome}
                    <span className="pasta__contagem">{doGrupo.length}</span>
                  </h3>
                  {!grupo.fixa && (
                    <div className="pasta__acoes">
                      <button
                        type="button"
                        className="botao botao--texto"
                        onClick={() => comecarEdicao(grupo)}
                      >
                        Renomear
                      </button>
                      <button
                        type="button"
                        className="botao botao--texto botao--perigo"
                        onClick={() => excluirPasta(grupo, doGrupo.length)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </>
              )}
            </header>

            {doGrupo.length === 0 ? (
              <p className="pasta__vazia">
                {arrasto?.tipo === 'pedido'
                  ? 'Solte um pedido aqui'
                  : 'Pasta vazia — arraste pedidos para cá.'}
              </p>
            ) : (
              <ul className="pasta__pedidos">
                {doGrupo.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    status={statusPorPedido.get(pedido.id)}
                    arrastando={arrasto?.tipo === 'pedido' && arrasto.id === pedido.id}
                    indicador={
                      alvo?.tipo === 'pedido' && alvo.id === pedido.id && arrasto?.id !== pedido.id
                        ? alvo.posicao
                        : null
                    }
                    onEditar={() => onEditarPedido(pedido)}
                    onDuplicar={() => duplicarPedido(pedido.id)}
                    onExcluir={() => removerPedido(pedido.id)}
                    onDragStart={(evento) => iniciarArrastoPedido(evento, pedido)}
                    onDragEnd={limparArrasto}
                    onDragOver={(evento) => sobreCard(evento, pedido)}
                    onDrop={(evento) => soltarNoCard(evento, pedido)}
                  />
                ))}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
