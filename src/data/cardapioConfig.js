// -----------------------------------------------------------------------------
// Todas as opções do cardápio vivem aqui.
// Sem preços nesta versão: o app assume custo zero e não exibe valores.
// -----------------------------------------------------------------------------

export const TAMANHOS = ['Infantil', 'Individual', 'Grande', 'Família']

export const MASSAS = [
  'Espaguete',
  'Penne',
  'Fusilli',
  'Talharim',
  'Fettuccine',
  'Linguine',
  'Farfalle',
  'Rigatoni',
  'Conchiglie',
  'Capellini',
  'Nhoque',
  'Ravioli de queijo',
  'Ravioli de carne',
  'Ravioli de ricota',
  'Lasagna',
]

export const TIPOS_MASSA = ['Tradicional', 'Integral', 'Sem glúten']

export const MOLHOS = [
  'Pomodoro',
  'Bolonhesa',
  'Quatro queijos',
  'Molho branco',
  'Alfredo',
  'Funghi',
  'Pesto',
  'Rosé',
  'Parmesão',
  'Gorgonzola',
  'Carbonara',
  'Alho e óleo',
]

// Etapa opcional: o valor padrão é "Sem molho extra", para a etapa nunca ficar vazia.
export const SEM_MOLHO_EXTRA = 'Sem molho extra'
export const MOLHOS_EXTRA = [SEM_MOLHO_EXTRA, ...MOLHOS]

export const ADICIONAIS = [
  'Alho-poró',
  'Aspargos',
  'Atum',
  'Azeitona preta',
  'Azeitona verde',
  'Bacon',
  'Brócolis',
  'Calabresa',
  'Camarão',
  'Cebola',
  'Cenoura',
  'Champignon',
  'Couve-flor',
  'Croutons',
  'Ervilha',
  'Espinafre',
  'Milho',
  'Nozes',
  'Palmito',
  'Peito de peru',
  'Pimenta-biquinho',
  'Pimentão',
  'Presunto',
  'Rúcula',
  'Salmão',
  'Shimeji',
  'Shiitake',
  'Tomate',
  'Tomate-cereja',
  'Vagem',
]

export const FINALIZACOES = [
  'Parmesão ralado',
  'Muçarela de búfala',
  'Manjericão fresco',
  'Azeite',
  'Azeite trufado',
  'Pimenta-do-reino',
  'Orégano',
  'Alho crocante',
  'Cebolinha',
]

export const BEBIDAS = [
  'Água sem gás',
  'Água com gás',
  'Coca-Cola Zero',
  'Coca-Cola',
  'Guaraná',
  'Suco de laranja',
  'Suco de limão',
  'Suco de uva',
  'Suco de melancia',
  'Suco de morango',
  'Soda Italiana de Limão',
  'Soda Italiana de Maçã Verde',
  'Soda Italiana de Frutas Vermelhas',
  'Soda Italiana de Maracujá',
  'Chá matte',
  'Aperol Spritz',
  'Cerveja em lata',
  'Cerveja em garrafa',
  'Vinho tinto',
  'Vinho branco',
  'Vinho rosé',
]

// -----------------------------------------------------------------------------
// Etapas do wizard, na ordem fixa de montagem.
//
// tipo:
//   'unica'    -> uma opção por vez (botões tipo rádio)
//   'contador' -> múltipla escolha com contador +/- (repetição permitida)
//   'multipla' -> múltipla escolha simples (liga/desliga, sem contador)
//   'revisao'  -> não é uma etapa de escolha, é o resumo final
// -----------------------------------------------------------------------------

export const ETAPAS = [
  {
    id: 'tamanho',
    campo: 'tamanho',
    titulo: 'Tamanho',
    icone: '🍽️',
    descricao: 'Para quantas pessoas é esse prato?',
    tipo: 'unica',
    opcoes: TAMANHOS,
    padrao: 'Individual',
  },
  {
    id: 'massa',
    campo: 'massa',
    titulo: 'Massa',
    icone: '🍝',
    descricao: 'Escolha o formato da massa.',
    tipo: 'unica',
    opcoes: MASSAS,
    padrao: 'Espaguete',
  },
  {
    id: 'tipoMassa',
    campo: 'tipoMassa',
    titulo: 'Tipo de Massa',
    icone: '🌾',
    descricao: 'Como a massa é preparada.',
    tipo: 'unica',
    opcoes: TIPOS_MASSA,
    padrao: 'Tradicional',
  },
  {
    id: 'molho',
    campo: 'molho',
    titulo: 'Molho',
    icone: '🥫',
    descricao: 'O molho principal do prato.',
    tipo: 'unica',
    opcoes: MOLHOS,
    padrao: 'Pomodoro',
  },
  {
    id: 'molhoExtra',
    campo: 'molhoExtra',
    titulo: 'Molho Extra',
    icone: '➕',
    descricao: 'Opcional: um segundo molho para combinar.',
    tipo: 'unica',
    opcoes: MOLHOS_EXTRA,
    padrao: SEM_MOLHO_EXTRA,
  },
  {
    id: 'adicionais',
    campo: 'adicionais',
    titulo: 'Adicionais',
    icone: '🧅',
    descricao: 'Pode repetir o mesmo item: use + e − para ajustar a quantidade.',
    tipo: 'contador',
    opcoes: ADICIONAIS,
    padrao: {},
  },
  {
    id: 'finalizacao',
    campo: 'finalizacao',
    titulo: 'Finalização',
    icone: '🌿',
    descricao: 'Toques finais por cima do prato.',
    tipo: 'multipla',
    opcoes: FINALIZACOES,
    padrao: [],
  },
  {
    id: 'bebida',
    campo: 'bebida',
    titulo: 'Bebida',
    icone: '🥤',
    descricao: 'Para acompanhar.',
    tipo: 'unica',
    opcoes: BEBIDAS,
    padrao: 'Água sem gás',
  },
  {
    id: 'revisao',
    campo: null,
    titulo: 'Revisão',
    icone: '✅',
    descricao: 'Confira tudo antes de salvar o pedido.',
    tipo: 'revisao',
    opcoes: [],
    padrao: null,
  },
]

export const ETAPAS_DE_ESCOLHA = ETAPAS.filter((etapa) => etapa.tipo !== 'revisao')

export const INDICE_REVISAO = ETAPAS.findIndex((etapa) => etapa.tipo === 'revisao')

/** Escolhas iniciais de um pedido novo, já com o padrão de cada etapa. */
export function escolhasPadrao() {
  const escolhas = {}
  for (const etapa of ETAPAS_DE_ESCOLHA) {
    if (etapa.tipo === 'contador') escolhas[etapa.campo] = {}
    else if (etapa.tipo === 'multipla') escolhas[etapa.campo] = []
    else escolhas[etapa.campo] = etapa.padrao
  }
  return escolhas
}

/** Normaliza escolhas vindas do JSON, preenchendo campos ausentes com o padrão. */
export function normalizarEscolhas(escolhas) {
  const base = escolhasPadrao()
  if (!escolhas || typeof escolhas !== 'object') return base
  for (const etapa of ETAPAS_DE_ESCOLHA) {
    const valor = escolhas[etapa.campo]
    if (valor === undefined || valor === null) continue
    if (etapa.tipo === 'contador') {
      base[etapa.campo] =
        typeof valor === 'object' && !Array.isArray(valor) ? { ...valor } : {}
    } else if (etapa.tipo === 'multipla') {
      base[etapa.campo] = Array.isArray(valor) ? [...valor] : []
    } else {
      base[etapa.campo] = valor
    }
  }
  return base
}

/** Texto curto de uma etapa para o preview/resumo. Devolve '' quando a etapa está vazia. */
export function descreverEscolha(etapa, escolhas) {
  const valor = escolhas?.[etapa.campo]
  if (etapa.tipo === 'contador') {
    const itens = Object.entries(valor || {}).filter(([, qtd]) => qtd > 0)
    if (itens.length === 0) return ''
    return itens.map(([nome, qtd]) => (qtd > 1 ? `${nome} x${qtd}` : nome)).join(', ')
  }
  if (etapa.tipo === 'multipla') {
    const itens = Array.isArray(valor) ? valor : []
    return itens.length ? itens.join(', ') : ''
  }
  return valor || ''
}

/** Quantidade total de itens marcados numa etapa (usado nos badges do stepper). */
export function contarEscolhas(etapa, escolhas) {
  const valor = escolhas?.[etapa.campo]
  if (etapa.tipo === 'contador') {
    return Object.values(valor || {}).reduce((total, qtd) => total + (qtd > 0 ? qtd : 0), 0)
  }
  if (etapa.tipo === 'multipla') return Array.isArray(valor) ? valor.length : 0
  return valor ? 1 : 0
}

/** Nome sugerido para o pedido, a partir das escolhas principais. */
export function sugerirNome(escolhas) {
  const massa = escolhas?.massa || 'Massa'
  const molho = escolhas?.molho || ''
  const tamanho = escolhas?.tamanho || ''
  const base = molho ? `${massa} ao ${molho}` : massa
  return tamanho ? `${base} (${tamanho})` : base
}
