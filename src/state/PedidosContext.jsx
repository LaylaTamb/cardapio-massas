import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { normalizarEscolhas } from '../data/cardapioConfig.js'
import {
  configuracaoValida,
  getPedidos,
  salvarPedidos,
  variaveisFaltando,
} from '../services/githubApi.js'

// -----------------------------------------------------------------------------
// Estado dos pedidos já salvos (em memória) + sincronização com o pedidos.json.
//
// Fluxo: ao abrir, lê o JSON do GitHub e guarda uma cópia ("baseline"). Tudo o
// que o usuário faz depois mexe só no estado React. O commit compara o estado
// atual com a baseline para mostrar o que está pendente e só então faz o PUT.
// -----------------------------------------------------------------------------

const PedidosContext = createContext(null)

export const VERSAO_ARQUIVO = 1

export const CRITERIOS_ORDENACAO = [
  { id: 'manual', rotulo: 'Ordem manual' },
  { id: 'nome-asc', rotulo: 'Nome (A → Z)' },
  { id: 'nome-desc', rotulo: 'Nome (Z → A)' },
  { id: 'criacao-desc', rotulo: 'Mais recentes' },
  { id: 'criacao-asc', rotulo: 'Mais antigos' },
]

function novoId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

/** JSON com chaves ordenadas, para comparar dois objetos sem depender da ordem. */
function canonico(valor) {
  if (Array.isArray(valor)) return `[${valor.map(canonico).join(',')}]`
  if (valor && typeof valor === 'object') {
    const chaves = Object.keys(valor).sort()
    return `{${chaves.map((c) => `${JSON.stringify(c)}:${canonico(valor[c])}`).join(',')}}`
  }
  return JSON.stringify(valor ?? null)
}

/** Assinatura de um pedido para o diff: ignora `atualizadoEm` de propósito, */
/** senão reabrir e salvar sem mudar nada já contaria como alteração. */
function assinaturaPedido(pedido) {
  return canonico({
    nome: pedido.nome,
    pastaId: pedido.pastaId ?? null,
    criadoEm: pedido.criadoEm,
    escolhas: pedido.escolhas,
  })
}

function assinaturaPasta(pasta) {
  return canonico({ nome: pasta.nome })
}

export function criarPedido({ nome, escolhas, pastaId = null }) {
  const agora = new Date().toISOString()
  return {
    id: novoId(),
    nome: nome?.trim() || 'Pedido sem nome',
    pastaId: pastaId ?? null,
    criadoEm: agora,
    atualizadoEm: agora,
    escolhas: normalizarEscolhas(escolhas),
  }
}

/** Aceita o JSON cru do repositório e devolve um estado consistente. */
function normalizarArquivo(dados) {
  const pastasBrutas = Array.isArray(dados?.pastas) ? dados.pastas : []
  const pastas = pastasBrutas
    .filter((pasta) => pasta && typeof pasta === 'object')
    .map((pasta) => ({
      id: pasta.id || novoId(),
      nome: typeof pasta.nome === 'string' && pasta.nome.trim() ? pasta.nome : 'Pasta sem nome',
    }))

  const idsDePasta = new Set(pastas.map((pasta) => pasta.id))
  const pedidosBrutos = Array.isArray(dados?.pedidos) ? dados.pedidos : []
  const pedidos = pedidosBrutos
    .filter((pedido) => pedido && typeof pedido === 'object')
    .map((pedido) => {
      const criadoEm = pedido.criadoEm || new Date().toISOString()
      return {
        id: pedido.id || novoId(),
        nome:
          typeof pedido.nome === 'string' && pedido.nome.trim()
            ? pedido.nome
            : 'Pedido sem nome',
        // Pedido órfão (pasta apagada por fora) volta para "Sem pasta".
        pastaId: pedido.pastaId && idsDePasta.has(pedido.pastaId) ? pedido.pastaId : null,
        criadoEm,
        atualizadoEm: pedido.atualizadoEm || criadoEm,
        escolhas: normalizarEscolhas(pedido.escolhas),
      }
    })

  return { pastas, pedidos }
}

/** Compara o estado atual com a baseline e lista o que ainda não foi commitado. */
function calcularPendencias(atual, baseline) {
  if (!baseline) return []
  const pendencias = []

  const pedidosBase = new Map(baseline.pedidos.map((p) => [p.id, p]))
  for (const pedido of atual.pedidos) {
    const anterior = pedidosBase.get(pedido.id)
    if (!anterior) {
      pendencias.push({ tipo: 'pedido-novo', texto: `Pedido novo: ${pedido.nome}` })
    } else if (assinaturaPedido(anterior) !== assinaturaPedido(pedido)) {
      pendencias.push({ tipo: 'pedido-alterado', texto: `Pedido alterado: ${pedido.nome}` })
    }
  }
  const idsAtuais = new Set(atual.pedidos.map((p) => p.id))
  for (const anterior of baseline.pedidos) {
    if (!idsAtuais.has(anterior.id)) {
      pendencias.push({ tipo: 'pedido-removido', texto: `Pedido excluído: ${anterior.nome}` })
    }
  }

  const pastasBase = new Map(baseline.pastas.map((p) => [p.id, p]))
  for (const pasta of atual.pastas) {
    const anterior = pastasBase.get(pasta.id)
    if (!anterior) {
      pendencias.push({ tipo: 'pasta-nova', texto: `Pasta nova: ${pasta.nome}` })
    } else if (assinaturaPasta(anterior) !== assinaturaPasta(pasta)) {
      pendencias.push({
        tipo: 'pasta-alterada',
        texto: `Pasta renomeada: ${anterior.nome} → ${pasta.nome}`,
      })
    }
  }
  const idsPastasAtuais = new Set(atual.pastas.map((p) => p.id))
  for (const anterior of baseline.pastas) {
    if (!idsPastasAtuais.has(anterior.id)) {
      pendencias.push({ tipo: 'pasta-removida', texto: `Pasta excluída: ${anterior.nome}` })
    }
  }

  // Reordenação pura (sem inclusão/exclusão) também precisa de commit.
  const ordemAtual = atual.pedidos.filter((p) => pedidosBase.has(p.id)).map((p) => p.id)
  const ordemBase = baseline.pedidos.filter((p) => idsAtuais.has(p.id)).map((p) => p.id)
  if (ordemAtual.join('|') !== ordemBase.join('|')) {
    pendencias.push({ tipo: 'ordem', texto: 'Ordem dos pedidos alterada' })
  }
  const ordemPastasAtual = atual.pastas.filter((p) => pastasBase.has(p.id)).map((p) => p.id)
  const ordemPastasBase = baseline.pastas.filter((p) => idsPastasAtuais.has(p.id)).map((p) => p.id)
  if (ordemPastasAtual.join('|') !== ordemPastasBase.join('|')) {
    pendencias.push({ tipo: 'ordem', texto: 'Ordem das pastas alterada' })
  }

  return pendencias
}

export function PedidosProvider({ children }) {
  const [pedidos, setPedidos] = useState([])
  const [pastas, setPastas] = useState([])
  const [baseline, setBaseline] = useState(null)
  const [sha, setSha] = useState(null)
  const [arquivoExiste, setArquivoExiste] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)
  const [statusCommit, setStatusCommit] = useState({ estado: 'ocioso' })
  const [criterioOrdenacao, setCriterioOrdenacao] = useState('manual')

  const semConfiguracao = !configuracaoValida()

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErroCarregamento(null)
    setStatusCommit({ estado: 'ocioso' })

    if (!configuracaoValida()) {
      // Sem .env configurado o app ainda funciona, só não fala com o GitHub.
      setPedidos([])
      setPastas([])
      setBaseline({ pedidos: [], pastas: [] })
      setSha(null)
      setArquivoExiste(false)
      setErroCarregamento({
        tipo: 'config',
        mensagem: `Configuração incompleta no .env: ${variaveisFaltando().join(', ')}.`,
      })
      setCarregando(false)
      return
    }

    try {
      const resposta = await getPedidos()
      const { pedidos: lidos, pastas: lidas } = normalizarArquivo(resposta.dados)
      setPedidos(lidos)
      setPastas(lidas)
      setBaseline({ pedidos: lidos, pastas: lidas })
      setSha(resposta.sha)
      setArquivoExiste(resposta.existe)
    } catch (erro) {
      setErroCarregamento({ tipo: erro.tipo || 'generico', mensagem: erro.message })
      setPedidos([])
      setPastas([])
      setBaseline(null)
      setSha(null)
      setArquivoExiste(false)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const pendencias = useMemo(
    () => calcularPendencias({ pedidos, pastas }, baseline),
    [pedidos, pastas, baseline],
  )

  // Estado de sincronização por pedido, para o badge do card.
  const statusPorPedido = useMemo(() => {
    const mapa = new Map()
    const pedidosBase = new Map((baseline?.pedidos || []).map((p) => [p.id, p]))
    for (const pedido of pedidos) {
      const anterior = pedidosBase.get(pedido.id)
      if (!baseline) mapa.set(pedido.id, 'desconhecido')
      else if (!anterior) mapa.set(pedido.id, 'novo')
      else if (assinaturaPedido(anterior) !== assinaturaPedido(pedido))
        mapa.set(pedido.id, 'modificado')
      else mapa.set(pedido.id, 'sincronizado')
    }
    return mapa
  }, [pedidos, baseline])

  // Avisa antes de fechar a aba com trabalho não commitado.
  useEffect(() => {
    if (pendencias.length === 0) return undefined
    const aviso = (evento) => {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [pendencias.length])

  // --- CRUD de pedidos ------------------------------------------------------

  const adicionarPedido = useCallback(({ nome, escolhas, pastaId = null }) => {
    const pedido = criarPedido({ nome, escolhas, pastaId })
    setPedidos((atuais) => [...atuais, pedido])
    return pedido
  }, [])

  const atualizarPedido = useCallback((id, mudancas) => {
    setPedidos((atuais) =>
      atuais.map((pedido) =>
        pedido.id === id
          ? {
              ...pedido,
              ...mudancas,
              escolhas: mudancas.escolhas
                ? normalizarEscolhas(mudancas.escolhas)
                : pedido.escolhas,
              atualizadoEm: new Date().toISOString(),
            }
          : pedido,
      ),
    )
  }, [])

  const removerPedido = useCallback((id) => {
    setPedidos((atuais) => atuais.filter((pedido) => pedido.id !== id))
  }, [])

  const duplicarPedido = useCallback((id) => {
    setPedidos((atuais) => {
      const indice = atuais.findIndex((pedido) => pedido.id === id)
      if (indice === -1) return atuais
      const original = atuais[indice]
      const copia = criarPedido({
        nome: `${original.nome} (cópia)`,
        escolhas: original.escolhas,
        pastaId: original.pastaId,
      })
      const novos = [...atuais]
      novos.splice(indice + 1, 0, copia)
      return novos
    })
  }, [])

  /** Move um pedido para outra pasta e/ou outra posição (usado no drag-and-drop). */
  const reordenarPedido = useCallback(({ idArrastado, pastaDestino = null, idAlvo = null, posicao = 'antes' }) => {
    setCriterioOrdenacao('manual')
    setPedidos((atuais) => {
      const indiceOrigem = atuais.findIndex((pedido) => pedido.id === idArrastado)
      if (indiceOrigem === -1) return atuais
      if (idAlvo === idArrastado) {
        // Só mudou de pasta, ficando no mesmo ponto da lista.
        const iguais = atuais[indiceOrigem].pastaId === pastaDestino
        if (iguais) return atuais
        const novos = [...atuais]
        novos[indiceOrigem] = { ...novos[indiceOrigem], pastaId: pastaDestino }
        return novos
      }

      const novos = [...atuais]
      const [movido] = novos.splice(indiceOrigem, 1)
      const atualizado = { ...movido, pastaId: pastaDestino }

      let destino = novos.length
      if (idAlvo) {
        const indiceAlvo = novos.findIndex((pedido) => pedido.id === idAlvo)
        if (indiceAlvo !== -1) destino = indiceAlvo + (posicao === 'depois' ? 1 : 0)
      } else {
        // Sem alvo: joga no fim do grupo da pasta de destino, se ele existir.
        const ultimoDaPasta = novos.reduce(
          (indice, pedido, i) => (pedido.pastaId === pastaDestino ? i : indice),
          -1,
        )
        destino = ultimoDaPasta === -1 ? novos.length : ultimoDaPasta + 1
      }

      novos.splice(destino, 0, atualizado)
      return novos
    })
  }, [])

  const ordenarPedidos = useCallback((criterio) => {
    setCriterioOrdenacao(criterio)
    if (criterio === 'manual') return
    setPedidos((atuais) => {
      const copia = [...atuais]
      const porNome = (a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
      const porData = (a, b) => new Date(a.criadoEm) - new Date(b.criadoEm)
      if (criterio === 'nome-asc') copia.sort(porNome)
      else if (criterio === 'nome-desc') copia.sort((a, b) => porNome(b, a))
      else if (criterio === 'criacao-asc') copia.sort(porData)
      else if (criterio === 'criacao-desc') copia.sort((a, b) => porData(b, a))
      return copia
    })
  }, [])

  // --- CRUD de pastas -------------------------------------------------------

  const criarPasta = useCallback((nome) => {
    const pasta = { id: novoId(), nome: nome?.trim() || 'Nova pasta' }
    setPastas((atuais) => [...atuais, pasta])
    return pasta
  }, [])

  const renomearPasta = useCallback((id, nome) => {
    setPastas((atuais) =>
      atuais.map((pasta) => (pasta.id === id ? { ...pasta, nome: nome.trim() || pasta.nome } : pasta)),
    )
  }, [])

  /** Remove a pasta; os pedidos dela voltam para "Sem pasta" (nunca são apagados junto). */
  const removerPasta = useCallback((id) => {
    setPastas((atuais) => atuais.filter((pasta) => pasta.id !== id))
    setPedidos((atuais) =>
      atuais.map((pedido) => (pedido.pastaId === id ? { ...pedido, pastaId: null } : pedido)),
    )
  }, [])

  const reordenarPasta = useCallback(({ idArrastada, idAlvo, posicao = 'antes' }) => {
    setPastas((atuais) => {
      if (idArrastada === idAlvo) return atuais
      const indiceOrigem = atuais.findIndex((pasta) => pasta.id === idArrastada)
      if (indiceOrigem === -1) return atuais
      const novas = [...atuais]
      const [movida] = novas.splice(indiceOrigem, 1)
      let destino = novas.length
      if (idAlvo) {
        const indiceAlvo = novas.findIndex((pasta) => pasta.id === idAlvo)
        if (indiceAlvo !== -1) destino = indiceAlvo + (posicao === 'depois' ? 1 : 0)
      }
      novas.splice(destino, 0, movida)
      return novas
    })
  }, [])

  // --- Commit ---------------------------------------------------------------

  const montarArquivo = useCallback(
    () => ({
      versao: VERSAO_ARQUIVO,
      atualizadoEm: new Date().toISOString(),
      pastas,
      pedidos,
    }),
    [pastas, pedidos],
  )

  const commitar = useCallback(
    async ({ mensagem, forcar = false } = {}) => {
      setStatusCommit({ estado: 'enviando' })
      const conteudo = montarArquivo()
      try {
        const resultado = await salvarPedidos({
          dados: conteudo,
          shaConhecido: arquivoExiste ? sha : null,
          mensagem:
            mensagem?.trim() ||
            `Atualiza pedidos (${pendencias.length} altera${pendencias.length === 1 ? 'ção' : 'ções'})`,
          forcar,
        })
        setSha(resultado.sha)
        setArquivoExiste(true)
        setBaseline({ pedidos, pastas })
        setStatusCommit({
          estado: 'sucesso',
          commitUrl: resultado.commitUrl,
          commitSha: resultado.commitSha,
          criouArquivo: resultado.criouArquivo,
          quando: new Date().toISOString(),
        })
        return resultado
      } catch (erro) {
        setStatusCommit({
          estado: 'erro',
          mensagem: erro.message,
          tipo: erro.tipo || 'generico',
        })
        throw erro
      }
    },
    [arquivoExiste, montarArquivo, pastas, pedidos, pendencias.length, sha],
  )

  const limparStatusCommit = useCallback(() => setStatusCommit({ estado: 'ocioso' }), [])

  const valor = useMemo(
    () => ({
      pedidos,
      pastas,
      carregando,
      erroCarregamento,
      semConfiguracao,
      sha,
      arquivoExiste,
      baseline,
      pendencias,
      statusPorPedido,
      statusCommit,
      criterioOrdenacao,
      carregar,
      adicionarPedido,
      atualizarPedido,
      removerPedido,
      duplicarPedido,
      reordenarPedido,
      ordenarPedidos,
      criarPasta,
      renomearPasta,
      removerPasta,
      reordenarPasta,
      commitar,
      limparStatusCommit,
      montarArquivo,
    }),
    [
      pedidos,
      pastas,
      carregando,
      erroCarregamento,
      semConfiguracao,
      sha,
      arquivoExiste,
      baseline,
      pendencias,
      statusPorPedido,
      statusCommit,
      criterioOrdenacao,
      carregar,
      adicionarPedido,
      atualizarPedido,
      removerPedido,
      duplicarPedido,
      reordenarPedido,
      ordenarPedidos,
      criarPasta,
      renomearPasta,
      removerPasta,
      reordenarPasta,
      commitar,
      limparStatusCommit,
      montarArquivo,
    ],
  )

  return <PedidosContext.Provider value={valor}>{children}</PedidosContext.Provider>
}

export function usePedidos() {
  const contexto = useContext(PedidosContext)
  if (!contexto) throw new Error('usePedidos precisa estar dentro de <PedidosProvider>')
  return contexto
}
