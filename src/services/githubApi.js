// -----------------------------------------------------------------------------
// Conversa direta com a API REST do GitHub, a partir do navegador.
//
// ⚠️ AVISO DE SEGURANÇA
// O Vite injeta qualquer variável VITE_* dentro do bundle JavaScript servido ao
// navegador. Isso significa que o Personal Access Token abaixo fica LEGÍVEL para
// quem tiver acesso à página. Este projeto assume que o app roda APENAS na sua
// máquina (`npm run dev`) e NUNCA é publicado/hospedado. Se um dia quiser expor
// o app, o token precisa sair do frontend e ir para um backend próprio.
// -----------------------------------------------------------------------------

const API_BASE = 'https://api.github.com'

export const config = {
  token: import.meta.env.VITE_GITHUB_TOKEN || '',
  owner: import.meta.env.VITE_GITHUB_OWNER || '',
  repo: import.meta.env.VITE_GITHUB_REPO || '',
  branch: import.meta.env.VITE_GITHUB_BRANCH || 'main',
  path: import.meta.env.VITE_GITHUB_PATH || 'pedidos.json',
}

/** Lista das variáveis de ambiente que faltam preencher no .env. */
export function variaveisFaltando() {
  const faltando = []
  if (!config.token) faltando.push('VITE_GITHUB_TOKEN')
  if (!config.owner) faltando.push('VITE_GITHUB_OWNER')
  if (!config.repo) faltando.push('VITE_GITHUB_REPO')
  return faltando
}

export function configuracaoValida() {
  return variaveisFaltando().length === 0
}

/** Ex.: usuario/repositorio@main:pedidos.json */
export function descricaoDestino() {
  return `${config.owner}/${config.repo}@${config.branch}:${config.path}`
}

export function urlDoArquivoNoGitHub() {
  return `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${config.path}`
}

export class ErroGitHub extends Error {
  constructor(mensagem, { status, detalhes, tipo } = {}) {
    super(mensagem)
    this.name = 'ErroGitHub'
    this.status = status
    this.detalhes = detalhes
    // 'conflito' = o arquivo mudou no GitHub depois que carregamos.
    this.tipo = tipo || 'generico'
  }
}

// --- base64 <-> texto UTF-8 -------------------------------------------------
// atob/btoa trabalham byte a byte, então acentos precisam passar por
// TextEncoder/TextDecoder para não corromperem.

function base64ParaTexto(base64) {
  const limpo = String(base64).replace(/\s/g, '')
  const binario = atob(limpo)
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i)
  return new TextDecoder('utf-8').decode(bytes)
}

function textoParaBase64(texto) {
  const bytes = new TextEncoder().encode(texto)
  let binario = ''
  const bloco = 0x8000 // evita estourar o limite de argumentos do fromCharCode
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco))
  }
  return btoa(binario)
}

// --- requisição base --------------------------------------------------------

function cabecalhos() {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${config.token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
}

function urlDoConteudo(comRef = false) {
  const caminho = config.path
    .split('/')
    .map((parte) => encodeURIComponent(parte))
    .join('/')
  const base = `${API_BASE}/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(
    config.repo,
  )}/contents/${caminho}`
  return comRef ? `${base}?ref=${encodeURIComponent(config.branch)}` : base
}

async function lerErro(resposta) {
  let corpo = null
  try {
    corpo = await resposta.json()
  } catch {
    corpo = null
  }
  const mensagemApi = corpo?.message || resposta.statusText

  if (resposta.status === 401) {
    return new ErroGitHub(
      'Token recusado pelo GitHub (401). Confira o VITE_GITHUB_TOKEN no .env e reinicie o npm run dev.',
      { status: 401, detalhes: mensagemApi },
    )
  }
  if (resposta.status === 403) {
    return new ErroGitHub(
      'Acesso negado (403). O token pode não ter a permissão de escrita em Contents nesse repositório.',
      { status: 403, detalhes: mensagemApi },
    )
  }
  if (resposta.status === 404) {
    return new ErroGitHub(
      `Não encontrado (404): ${descricaoDestino()}. Verifique owner, repo e branch no .env — um token sem acesso ao repo também responde 404.`,
      { status: 404, detalhes: mensagemApi },
    )
  }
  if (resposta.status === 409 || resposta.status === 422) {
    return new ErroGitHub(
      'O arquivo mudou no GitHub desde a última leitura. Recarregue antes de commitar de novo.',
      { status: resposta.status, detalhes: mensagemApi, tipo: 'conflito' },
    )
  }
  return new ErroGitHub(`Erro do GitHub (${resposta.status}): ${mensagemApi}`, {
    status: resposta.status,
    detalhes: mensagemApi,
  })
}

function exigirConfiguracao() {
  const faltando = variaveisFaltando()
  if (faltando.length) {
    throw new ErroGitHub(
      `Configuração incompleta no .env: ${faltando.join(', ')}.`,
      { tipo: 'config' },
    )
  }
}

// --- API pública ------------------------------------------------------------

/**
 * Lê o arquivo de pedidos no GitHub.
 * Se o arquivo ainda não existe, devolve { existe: false } em vez de estourar —
 * o primeiro commit vai criá-lo.
 */
export async function getPedidos() {
  exigirConfiguracao()

  const resposta = await fetch(urlDoConteudo(true), {
    headers: cabecalhos(),
    cache: 'no-store',
  })

  if (resposta.status === 404) {
    return { existe: false, sha: null, dados: null, htmlUrl: urlDoArquivoNoGitHub() }
  }
  if (!resposta.ok) throw await lerErro(resposta)

  const corpo = await resposta.json()
  const texto = base64ParaTexto(corpo.content || '')

  let dados = null
  if (texto.trim()) {
    try {
      dados = JSON.parse(texto)
    } catch (erro) {
      throw new ErroGitHub(
        `O arquivo ${config.path} existe no repositório mas não é um JSON válido.`,
        { detalhes: erro.message, tipo: 'json' },
      )
    }
  }

  return { existe: true, sha: corpo.sha, dados, htmlUrl: corpo.html_url }
}

/** Busca só os metadados do arquivo (usado para pegar o sha fresco antes do PUT). */
export async function getMetadados() {
  exigirConfiguracao()

  const resposta = await fetch(urlDoConteudo(true), {
    headers: cabecalhos(),
    cache: 'no-store',
  })

  if (resposta.status === 404) return { existe: false, sha: null }
  if (!resposta.ok) throw await lerErro(resposta)

  const corpo = await resposta.json()
  return { existe: true, sha: corpo.sha }
}

/**
 * Grava o JSON no repositório, gerando um commit novo.
 *
 * A API do GitHub exige o `sha` do arquivo atual para updates, então buscamos um
 * sha fresco logo antes do PUT. Se ele não bate com o `shaConhecido` (o sha da
 * última leitura do app), alguém alterou o arquivo por fora: erro de conflito,
 * a menos que `forcar: true`.
 */
export async function salvarPedidos({ dados, shaConhecido, mensagem, forcar = false }) {
  exigirConfiguracao()

  const meta = await getMetadados()

  if (meta.existe && shaConhecido && meta.sha !== shaConhecido && !forcar) {
    throw new ErroGitHub(
      'O pedidos.json foi alterado no GitHub depois que este app carregou os dados. Recarregue (perdendo alterações locais) ou commite forçando a sobrescrita.',
      { tipo: 'conflito', detalhes: `sha remoto ${meta.sha} != sha local ${shaConhecido}` },
    )
  }

  const json = `${JSON.stringify(dados, null, 2)}\n`

  const corpoRequisicao = {
    message: mensagem,
    content: textoParaBase64(json),
    branch: config.branch,
  }
  // Sem sha o GitHub cria o arquivo; com sha ele atualiza.
  if (meta.existe) corpoRequisicao.sha = meta.sha

  const resposta = await fetch(urlDoConteudo(), {
    method: 'PUT',
    headers: cabecalhos(),
    body: JSON.stringify(corpoRequisicao),
  })

  if (!resposta.ok) throw await lerErro(resposta)

  const resultado = await resposta.json()
  return {
    sha: resultado.content?.sha ?? null,
    commitSha: resultado.commit?.sha ?? null,
    commitUrl: resultado.commit?.html_url ?? urlDoArquivoNoGitHub(),
    criouArquivo: !meta.existe,
  }
}
