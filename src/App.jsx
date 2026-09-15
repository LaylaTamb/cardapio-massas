import { useState } from 'react'
import CommitButton from './components/CommitButton.jsx'
import CardapioPage from './pages/CardapioPage.jsx'
import PedidosPage from './pages/PedidosPage.jsx'
import { usePedidoWizard } from './state/PedidoWizardContext.jsx'
import { usePedidos } from './state/PedidosContext.jsx'

const ABAS = [
  { id: 'cardapio', rotulo: 'Montar pedido', icone: '🍝' },
  { id: 'pedidos', rotulo: 'Pedidos criados', icone: '📋' },
]

export default function App() {
  const [aba, setAba] = useState('cardapio')
  const { iniciarEdicao } = usePedidoWizard()
  const { pedidos, pendencias } = usePedidos()

  function editarPedido(pedido) {
    iniciarEdicao(pedido)
    setAba('cardapio')
  }

  return (
    <div className="app">
      <header className="topo">
        <div className="topo__marca">
          <span className="topo__logo" aria-hidden="true">
            🍝
          </span>
          <div>
            <h1>Cardápio Interativo</h1>
            <p className="topo__subtitulo">Monte a massa, acumule pedidos, commite quando quiser.</p>
          </div>
        </div>

        <nav className="abas" aria-label="Seções do app">
          {ABAS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`aba ${aba === item.id ? 'aba--ativa' : ''}`}
              onClick={() => setAba(item.id)}
              aria-current={aba === item.id ? 'page' : undefined}
            >
              <span aria-hidden="true">{item.icone}</span>
              {item.rotulo}
              {item.id === 'pedidos' && pedidos.length > 0 && (
                <span className="aba__contagem">{pedidos.length}</span>
              )}
            </button>
          ))}
        </nav>

        <CommitButton />
      </header>

      <div className="conteudo">
        {aba === 'cardapio' ? (
          <CardapioPage onIrParaPedidos={() => setAba('pedidos')} />
        ) : (
          <PedidosPage
            onEditarPedido={editarPedido}
            onMontarPedido={() => setAba('cardapio')}
          />
        )}
      </div>

      <footer className="rodape">
        <span>
          App local. O token do GitHub vai no bundle do navegador — <strong>não publique</strong>{' '}
          este app.
        </span>
        {pendencias.length > 0 && (
          <span className="rodape__pendente">
            {pendencias.length} altera{pendencias.length === 1 ? 'ção' : 'ções'} aguardando commit
          </span>
        )}
      </footer>
    </div>
  )
}
