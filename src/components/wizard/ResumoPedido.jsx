import { useEffect, useState } from 'react'
import { ETAPAS_DE_ESCOLHA, descreverEscolha, sugerirNome } from '../../data/cardapioConfig.js'
import { usePedidoWizard } from '../../state/PedidoWizardContext.jsx'

/**
 * Tela final do wizard: todas as escolhas de todas as etapas, cada uma com um
 * "Alterar" que volta direto para aquela etapa sem perder o restante.
 *
 * Salvar aqui só adiciona o pedido à lista em memória — o commit no GitHub é
 * uma ação separada e explícita (CommitButton), para poder acumular vários.
 */
export default function ResumoPedido({ pastas, onSalvar, onDescartarEdicao }) {
  const { escolhas, irParaEtapaPorId, edicao, etapa } = usePedidoWizard()

  const [nome, setNome] = useState('')
  const [pastaId, setPastaId] = useState('')
  const [tocado, setTocado] = useState(false)

  // Enquanto o usuário não digitar um nome, ele acompanha as escolhas do prato.
  useEffect(() => {
    if (edicao) {
      setNome(edicao.nome)
      setPastaId(edicao.pastaId || '')
      setTocado(true)
    }
  }, [edicao])

  useEffect(() => {
    if (!tocado) setNome(sugerirNome(escolhas))
  }, [escolhas, tocado])

  function salvar(evento) {
    evento.preventDefault()
    const nomeFinal = nome.trim() || sugerirNome(escolhas)
    onSalvar({ nome: nomeFinal, pastaId: pastaId || null })
    setTocado(false)
  }

  return (
    <div className="etapa">
      <header className="etapa__cabecalho">
        <div>
          <h2 className="etapa__titulo">
            <span aria-hidden="true">{etapa.icone}</span> Revisão
          </h2>
          <p className="etapa__descricao">
            {edicao
              ? 'Você está editando um pedido já salvo. Confira e confirme as mudanças.'
              : 'Confira tudo antes de salvar. Clique em “Alterar” para voltar a qualquer etapa.'}
          </p>
        </div>
      </header>

      <ul className="resumo">
        {ETAPAS_DE_ESCOLHA.map((etapaResumo) => {
          const texto = descreverEscolha(etapaResumo, escolhas)
          return (
            <li key={etapaResumo.id} className="resumo__linha">
              <div className="resumo__conteudo">
                <span className="resumo__rotulo">
                  <span aria-hidden="true">{etapaResumo.icone}</span> {etapaResumo.titulo}
                </span>
                <span className={`resumo__valor ${texto ? '' : 'resumo__valor--vazio'}`}>
                  {texto || 'nada selecionado'}
                </span>
              </div>
              <button
                type="button"
                className="botao botao--texto"
                onClick={() => irParaEtapaPorId(etapaResumo.id)}
              >
                Alterar
              </button>
            </li>
          )
        })}
      </ul>

      <form className="salvar" onSubmit={salvar}>
        <h3 className="salvar__titulo">
          {edicao ? 'Salvar alterações do pedido' : 'Salvar este pedido'}
        </h3>

        <div className="salvar__campos">
          <label className="rotulo">
            Nome do pedido
            <input
              className="campo"
              value={nome}
              onChange={(evento) => {
                setNome(evento.target.value)
                setTocado(true)
              }}
              placeholder={sugerirNome(escolhas)}
              maxLength={120}
            />
          </label>

          <label className="rotulo">
            Pasta
            <select
              className="campo"
              value={pastaId}
              onChange={(evento) => setPastaId(evento.target.value)}
            >
              <option value="">Sem pasta</option>
              {pastas.map((pasta) => (
                <option key={pasta.id} value={pasta.id}>
                  {pasta.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="salvar__acoes">
          <button type="submit" className="botao botao--primario">
            {edicao ? 'Salvar alterações' : 'Salvar pedido'}
          </button>
          {edicao && (
            <button type="button" className="botao botao--fantasma" onClick={onDescartarEdicao}>
              Descartar alterações
            </button>
          )}
        </div>

        <p className="salvar__nota">
          O pedido fica só na memória até você usar o botão{' '}
          <strong>Salvar e commitar no GitHub</strong>.
        </p>
      </form>
    </div>
  )
}
