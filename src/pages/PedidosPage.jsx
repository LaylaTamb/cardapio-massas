import { useState } from 'react'
import PastaList from '../components/pedidos/PastaList.jsx'
import { descricaoDestino } from '../services/githubApi.js'
import { CRITERIOS_ORDENACAO, usePedidos } from '../state/PedidosContext.jsx'

/** Aba "Pedidos criados": pastas, CRUD, ordenação e estado de sincronização. */
export default function PedidosPage({ onEditarPedido, onMontarPedido }) {
  const {
    pedidos,
    pastas,
    carregando,
    erroCarregamento,
    carregar,
    criarPasta,
    ordenarPedidos,
    criterioOrdenacao,
    pendencias,
    arquivoExiste,
  } = usePedidos()

  const [nomeNovaPasta, setNomeNovaPasta] = useState('')

  function adicionarPasta(evento) {
    evento.preventDefault()
    if (!nomeNovaPasta.trim()) return
    criarPasta(nomeNovaPasta)
    setNomeNovaPasta('')
  }

  if (carregando) {
    return (
      <div className="estado">
        <span className="estado__spinner" aria-hidden="true" />
        <p>Lendo o pedidos.json do GitHub…</p>
      </div>
    )
  }

  return (
    <div className="pedidosPage">
      {erroCarregamento && (
        <div className={`alerta alerta--largo ${erroCarregamento.tipo === 'config' ? 'alerta--aviso' : 'alerta--erro'}`}>
          <p>
            <strong>
              {erroCarregamento.tipo === 'config'
                ? 'GitHub não configurado.'
                : 'Não deu para ler o GitHub.'}
            </strong>{' '}
            {erroCarregamento.mensagem}
          </p>
          <p className="alerta__detalhe">
            {erroCarregamento.tipo === 'config'
              ? 'Copie o .env.example para .env, preencha os valores e reinicie o npm run dev. O app continua funcionando offline, mas nada será commitado.'
              : `Destino configurado: ${descricaoDestino()}`}
          </p>
          {erroCarregamento.tipo !== 'config' && (
            <button type="button" className="botao botao--pequeno" onClick={carregar}>
              Tentar de novo
            </button>
          )}
        </div>
      )}

      {!erroCarregamento && !arquivoExiste && (
        <div className="alerta alerta--info alerta--largo">
          O arquivo <code>{descricaoDestino()}</code> ainda não existe no repositório. Ele será
          criado no seu primeiro commit.
        </div>
      )}

      <div className="barraFerramentas">
        <form className="barraFerramentas__grupo" onSubmit={adicionarPasta}>
          <input
            className="campo"
            placeholder="Nome da nova pasta"
            value={nomeNovaPasta}
            onChange={(evento) => setNomeNovaPasta(evento.target.value)}
            maxLength={80}
            aria-label="Nome da nova pasta"
          />
          <button type="submit" className="botao botao--pequeno" disabled={!nomeNovaPasta.trim()}>
            + Pasta
          </button>
        </form>

        <label className="barraFerramentas__grupo rotulo rotulo--inline">
          Ordenar por
          <select
            className="campo"
            value={criterioOrdenacao}
            onChange={(evento) => ordenarPedidos(evento.target.value)}
          >
            {CRITERIOS_ORDENACAO.map((criterio) => (
              <option key={criterio.id} value={criterio.id}>
                {criterio.rotulo}
              </option>
            ))}
          </select>
        </label>

        <div className="barraFerramentas__info">
          <span>
            <strong>{pedidos.length}</strong> pedido{pedidos.length === 1 ? '' : 's'} ·{' '}
            <strong>{pastas.length}</strong> pasta{pastas.length === 1 ? '' : 's'}
          </span>
          <span className={pendencias.length ? 'pendente' : 'sincronizado'}>
            {pendencias.length
              ? `${pendencias.length} altera${pendencias.length === 1 ? 'ção' : 'ções'} sem commit`
              : 'Tudo sincronizado com o GitHub'}
          </span>
        </div>
      </div>

      {pedidos.length === 0 && pastas.length === 0 ? (
        <div className="estado">
          <span className="estado__icone" aria-hidden="true">
            🍽️
          </span>
          <h2>Nenhum pedido ainda</h2>
          <p>Monte o primeiro prato no cardápio e ele aparece aqui.</p>
          <button type="button" className="botao botao--primario" onClick={onMontarPedido}>
            Montar um pedido
          </button>
        </div>
      ) : (
        <>
          <p className="dica">
            Arraste os cards pelo <span aria-hidden="true">⠿</span> para reordenar ou jogar em
            outra pasta. Trocar para uma ordenação automática substitui a ordem manual.
          </p>
          <PastaList onEditarPedido={onEditarPedido} />
        </>
      )}
    </div>
  )
}
