import { useMemo, useState } from 'react'
import { usePedidoWizard } from '../../state/PedidoWizardContext.jsx'

const LIMITE_PARA_BUSCA = 10

function semAcento(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Etapa de múltipla escolha. Dois modos, decididos pelo tipo da etapa:
 *
 * - 'contador'  (Adicionais)  → cada item tem +/- e pode repetir.
 * - 'multipla'  (Finalização) → só liga/desliga, porque repetir um toque final
 *                               não faz sentido.
 *
 * Nenhum dos dois tem mínimo obrigatório: dá para seguir sem escolher nada.
 */
export default function EtapaSelecaoMultipla({ etapa }) {
  const { escolhas, ajustarQuantidade, alternarItem, limparEtapa } = usePedidoWizard()
  const [busca, setBusca] = useState('')

  const comContador = etapa.tipo === 'contador'
  const valor = escolhas[etapa.campo]
  const quantidades = comContador ? valor || {} : null
  const marcados = comContador ? null : Array.isArray(valor) ? valor : []

  const totalItens = comContador
    ? Object.values(quantidades).reduce((soma, qtd) => soma + qtd, 0)
    : marcados.length

  const totalDistintos = comContador ? Object.keys(quantidades).length : marcados.length

  const mostrarBusca = etapa.opcoes.length > LIMITE_PARA_BUSCA

  const opcoesVisiveis = useMemo(() => {
    if (!busca.trim()) return etapa.opcoes
    const alvo = semAcento(busca.trim())
    return etapa.opcoes.filter((opcao) => semAcento(opcao).includes(alvo))
  }, [busca, etapa.opcoes])

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

      <div className="etapa__barra">
        <span className="etapa__contagem">
          {totalItens === 0
            ? 'Nada selecionado (é opcional)'
            : comContador
              ? `${totalItens} ${totalItens === 1 ? 'item' : 'itens'} · ${totalDistintos} ${
                  totalDistintos === 1 ? 'tipo' : 'tipos'
                }`
              : `${totalItens} ${totalItens === 1 ? 'selecionado' : 'selecionados'}`}
        </span>
        {totalItens > 0 && (
          <button type="button" className="botao botao--texto" onClick={() => limparEtapa(etapa.campo)}>
            Limpar etapa
          </button>
        )}
      </div>

      <div className="opcoes opcoes--multipla" role="group" aria-label={etapa.titulo}>
        {opcoesVisiveis.map((opcao) => {
          if (comContador) {
            const quantidade = quantidades[opcao] || 0
            const ativa = quantidade > 0
            return (
              <div key={opcao} className={`contador ${ativa ? 'contador--ativa' : ''}`}>
                <button
                  type="button"
                  className="contador__texto"
                  onClick={() => ajustarQuantidade(etapa.campo, opcao, 1)}
                  title={`Adicionar ${opcao}`}
                >
                  {opcao}
                </button>
                <div className="contador__controles">
                  <button
                    type="button"
                    className="contador__botao"
                    onClick={() => ajustarQuantidade(etapa.campo, opcao, -1)}
                    disabled={quantidade === 0}
                    aria-label={`Remover uma unidade de ${opcao}`}
                  >
                    −
                  </button>
                  <span className="contador__valor" aria-live="polite" aria-label={`${opcao}: ${quantidade}`}>
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    className="contador__botao"
                    onClick={() => ajustarQuantidade(etapa.campo, opcao, 1)}
                    aria-label={`Adicionar uma unidade de ${opcao}`}
                  >
                    +
                  </button>
                </div>
              </div>
            )
          }

          const ativa = marcados.includes(opcao)
          return (
            <button
              key={opcao}
              type="button"
              role="checkbox"
              aria-checked={ativa}
              className={`opcao ${ativa ? 'opcao--ativa' : ''}`}
              onClick={() => alternarItem(etapa.campo, opcao)}
            >
              <span className="opcao__marca opcao__marca--quadrada" aria-hidden="true" />
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
