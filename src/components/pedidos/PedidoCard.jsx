import { useState } from 'react'
import { ETAPAS_DE_ESCOLHA, descreverEscolha } from '../../data/cardapioConfig.js'

const SELOS = {
  novo: { texto: 'Não commitado', classe: 'selo--novo' },
  modificado: { texto: 'Alterado', classe: 'selo--modificado' },
  sincronizado: { texto: 'No GitHub', classe: 'selo--sincronizado' },
  desconhecido: { texto: 'Local', classe: 'selo--novo' },
}

function formatarData(iso) {
  if (!iso) return ''
  const data = new Date(iso)
  if (Number.isNaN(data.getTime())) return ''
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Card de um pedido salvo, arrastável entre as pastas. */
export default function PedidoCard({
  pedido,
  status = 'novo',
  arrastando = false,
  indicador = null,
  onEditar,
  onDuplicar,
  onExcluir,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}) {
  const [aberto, setAberto] = useState(false)
  const selo = SELOS[status] || SELOS.novo

  const linhaResumo = [
    pedido.escolhas.tamanho,
    pedido.escolhas.massa,
    pedido.escolhas.tipoMassa,
    pedido.escolhas.molho,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <li
      className={[
        'card',
        arrastando && 'card--arrastando',
        indicador === 'antes' && 'card--alvo-antes',
        indicador === 'depois' && 'card--alvo-depois',
      ]
        .filter(Boolean)
        .join(' ')}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="card__topo">
        <span className="card__pegador" aria-hidden="true" title="Arraste para reordenar ou mudar de pasta">
          ⠿
        </span>
        <div className="card__identificacao">
          <h4 className="card__nome">{pedido.nome}</h4>
          <p className="card__resumo">{linhaResumo}</p>
        </div>
        <span className={`selo ${selo.classe}`}>{selo.texto}</span>
      </div>

      <div className="card__meta">
        <span title={`Criado em ${formatarData(pedido.criadoEm)}`}>
          Criado em {formatarData(pedido.criadoEm)}
        </span>
        <button type="button" className="botao botao--texto" onClick={() => setAberto((v) => !v)}>
          {aberto ? 'Ocultar detalhes' : 'Ver detalhes'}
        </button>
      </div>

      {aberto && (
        <ul className="card__detalhes">
          {ETAPAS_DE_ESCOLHA.map((etapa) => {
            const texto = descreverEscolha(etapa, pedido.escolhas)
            return (
              <li key={etapa.id}>
                <span className="card__detalheRotulo">
                  <span aria-hidden="true">{etapa.icone}</span> {etapa.titulo}
                </span>
                <span className={texto ? '' : 'card__detalheVazio'}>{texto || '—'}</span>
              </li>
            )
          })}
        </ul>
      )}

      <div className="card__acoes">
        <button type="button" className="botao botao--pequeno" onClick={onEditar}>
          Editar
        </button>
        <button type="button" className="botao botao--pequeno botao--fantasma" onClick={onDuplicar}>
          Duplicar
        </button>
        <button
          type="button"
          className="botao botao--pequeno botao--perigo"
          onClick={() => {
            if (window.confirm(`Excluir o pedido "${pedido.nome}"?`)) onExcluir()
          }}
        >
          Excluir
        </button>
      </div>
    </li>
  )
}
