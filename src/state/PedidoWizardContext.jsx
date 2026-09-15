import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ETAPAS,
  INDICE_REVISAO,
  escolhasPadrao,
  normalizarEscolhas,
} from '../data/cardapioConfig.js'

// -----------------------------------------------------------------------------
// Estado do pedido que está sendo montado agora no wizard.
//
// Mudar de etapa nunca apaga escolha nenhuma: tudo fica no mesmo objeto
// `escolhas`, então dá para voltar, trocar algo e seguir sem perder o resto.
// -----------------------------------------------------------------------------

const PedidoWizardContext = createContext(null)

export function PedidoWizardProvider({ children }) {
  const [escolhas, setEscolhas] = useState(() => escolhasPadrao())
  const [indiceEtapa, setIndiceEtapa] = useState(0)
  const [etapasVisitadas, setEtapasVisitadas] = useState(() => new Set([ETAPAS[0].id]))
  // Quando != null, salvar atualiza um pedido existente em vez de criar outro.
  const [edicao, setEdicao] = useState(null)

  // Toda etapa exibida passa a ser clicável no stepper.
  useEffect(() => {
    const id = ETAPAS[indiceEtapa]?.id
    if (!id) return
    setEtapasVisitadas((atuais) => {
      if (atuais.has(id)) return atuais
      const novas = new Set(atuais)
      novas.add(id)
      return novas
    })
  }, [indiceEtapa])

  const etapa = ETAPAS[indiceEtapa]

  const definirEscolha = useCallback((campo, valor) => {
    setEscolhas((atuais) => ({ ...atuais, [campo]: valor }))
  }, [])

  /** Etapa de contador: soma/subtrai a quantidade de um adicional (mínimo 0). */
  const ajustarQuantidade = useCallback((campo, item, delta) => {
    setEscolhas((atuais) => {
      const mapa = { ...(atuais[campo] || {}) }
      const proxima = (mapa[item] || 0) + delta
      if (proxima <= 0) delete mapa[item]
      else mapa[item] = proxima
      return { ...atuais, [campo]: mapa }
    })
  }, [])

  /** Etapa de múltipla escolha simples: liga/desliga o item. */
  const alternarItem = useCallback((campo, item) => {
    setEscolhas((atuais) => {
      const lista = Array.isArray(atuais[campo]) ? atuais[campo] : []
      const jaTem = lista.includes(item)
      return {
        ...atuais,
        [campo]: jaTem ? lista.filter((atual) => atual !== item) : [...lista, item],
      }
    })
  }, [])

  const limparEtapa = useCallback((campo) => {
    setEscolhas((atuais) => {
      const etapaAlvo = ETAPAS.find((e) => e.campo === campo)
      if (!etapaAlvo) return atuais
      const vazio = etapaAlvo.tipo === 'contador' ? {} : etapaAlvo.tipo === 'multipla' ? [] : etapaAlvo.padrao
      return { ...atuais, [campo]: vazio }
    })
  }, [])

  const irParaEtapa = useCallback((indice) => {
    if (indice < 0 || indice >= ETAPAS.length) return
    setIndiceEtapa(indice)
  }, [])

  const irParaEtapaPorId = useCallback((id) => {
    const indice = ETAPAS.findIndex((e) => e.id === id)
    if (indice !== -1) setIndiceEtapa(indice)
  }, [])

  const avancar = useCallback(() => {
    setIndiceEtapa((atual) => Math.min(atual + 1, ETAPAS.length - 1))
  }, [])

  const voltar = useCallback(() => {
    setIndiceEtapa((atual) => Math.max(atual - 1, 0))
  }, [])

  /** Começa um pedido do zero, com os valores padrão de cada etapa. */
  const iniciarNovoPedido = useCallback(() => {
    setEscolhas(escolhasPadrao())
    setIndiceEtapa(0)
    setEtapasVisitadas(new Set([ETAPAS[0].id]))
    setEdicao(null)
  }, [])

  /** Reabre o wizard pré-preenchido com um pedido já salvo. */
  const iniciarEdicao = useCallback((pedido) => {
    setEscolhas(normalizarEscolhas(pedido.escolhas))
    setIndiceEtapa(0)
    // Um pedido salvo já passou por todas as etapas: todas ficam navegáveis.
    setEtapasVisitadas(new Set(ETAPAS.map((e) => e.id)))
    setEdicao({ id: pedido.id, nome: pedido.nome, pastaId: pedido.pastaId ?? null })
  }, [])

  const cancelarEdicao = useCallback(() => setEdicao(null), [])

  const valor = useMemo(
    () => ({
      escolhas,
      etapa,
      indiceEtapa,
      etapas: ETAPAS,
      indiceRevisao: INDICE_REVISAO,
      etapasVisitadas,
      edicao,
      definirEscolha,
      ajustarQuantidade,
      alternarItem,
      limparEtapa,
      irParaEtapa,
      irParaEtapaPorId,
      avancar,
      voltar,
      iniciarNovoPedido,
      iniciarEdicao,
      cancelarEdicao,
    }),
    [
      escolhas,
      etapa,
      indiceEtapa,
      etapasVisitadas,
      edicao,
      definirEscolha,
      ajustarQuantidade,
      alternarItem,
      limparEtapa,
      irParaEtapa,
      irParaEtapaPorId,
      avancar,
      voltar,
      iniciarNovoPedido,
      iniciarEdicao,
      cancelarEdicao,
    ],
  )

  return <PedidoWizardContext.Provider value={valor}>{children}</PedidoWizardContext.Provider>
}

export function usePedidoWizard() {
  const contexto = useContext(PedidoWizardContext)
  if (!contexto) throw new Error('usePedidoWizard precisa estar dentro de <PedidoWizardProvider>')
  return contexto
}
