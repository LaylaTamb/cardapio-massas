import { useMemo, useState } from 'react'
import { usePedidoWizard } from '../../state/PedidoWizardContext.jsx'

const LIMITE_PARA_BUSCA = 10

/** Etapa de escolha única: Tamanho, Massa, Tipo, Molho, Molho extra, Bebida. */
export default function EtapaSelecaoUnica({ etapa }) {
  const { escolhas, definirEscolha, avancar } = usePedidoWizard()
  const [busca, setBusca] = useState('')

  const selecionado = escolhas[etapa.campo]
  const mostrarBusca = etapa.opcoes.length > LIMITE_PARA_BUSCA

  const opcoesVisiveis = useMemo(() => {
    if (!busca.trim()) return etapa.opcoes
    const alvo = busca
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
    return etapa.opcoes.filter((opcao) =>
      opcao
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .includes(alvo),
    )
  }, [busca, etapa.opcoes])

  function escolher(opcao) {
    definirEscolha(etapa.campo, opcao)
  }

  return (
    <div className="etapa">
      <header className="etapa__cabecalho">
        <div>
          <h2 className="etapa__titulo">
            <span aria-hidden="true">{etapa.icone}</span> {etapa.titulo}
          </h2>
          <p className="etapa__descricao">{etapa.descricao}</p>
        </div>
        {mostrarBusca && (
          <input
            type="search"
            className="campo campo--busca"
            placeholder={`Filtrar ${etapa.titulo.toLowerCase()}...`}
            value={busca}
            onChange={(evento) => setBusca(evento.target.value)}
            aria-label={`Filtrar opções de ${etapa.titulo}`}
          />
        )}
      </header>

      <div className="opcoes" role="radiogroup" aria-label={etapa.titulo}>
        {opcoesVisiveis.map((opcao) => {
          const ativa = selecionado === opcao
          return (
            <button
              key={opcao}
              type="button"
              role="radio"
              aria-checked={ativa}
              className={`opcao ${ativa ? 'opcao--ativa' : ''}`}
              onClick={() => escolher(opcao)}
              onDoubleClick={avancar}
            >
              <span className="opcao__marca" aria-hidden="true" />
              <span className="opcao__texto">{opcao}</span>
            </button>
          )
        })}

        {opcoesVisiveis.length === 0 && (
          <p className="vazio">Nenhuma opção corresponde a “{busca}”.</p>
        )}
      </div>
    </div>
  )
}
