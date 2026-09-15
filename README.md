# Cardápio Interativo

App web **pessoal e local** para montar pedidos de massa passo a passo (wizard de 9 etapas) e
versionar os pedidos como um `pedidos.json` commitado direto no seu repositório do GitHub.

Sem backend, sem login, sem deploy: React + Vite rodando na sua máquina, falando direto com a
API REST do GitHub.

---

## ⚠️ Leia antes de rodar: por que este app é só local

O Vite injeta qualquer variável `VITE_*` **dentro do bundle JavaScript** que vai para o
navegador. O `VITE_GITHUB_TOKEN` fica, portanto, legível para qualquer pessoa que abra a
página ou o arquivo JS gerado.

Isso só é aceitável porque este app roda **exclusivamente em `localhost`, via `npm run dev`**.

- ❌ Não hospede em Vercel/Netlify/GitHub Pages/qualquer lugar público.
- ❌ Não distribua a pasta `dist/` gerada pelo `npm run build`.
- ❌ Não commite o arquivo `.env` (o `.gitignore` já cuida disso).
- ✅ Se um dia quiser expor o app, o token precisa sair do frontend e ir para um backend
  próprio que faça as chamadas ao GitHub.

Se o token vazar, revogue em <https://github.com/settings/tokens>.

---

## Instalação

```bash
npm install
```

## Configuração

Copie o exemplo e preencha:

```bash
cp .env.example .env
```

| Variável             | Obrigatória | Padrão         | O que é                                          |
| -------------------- | ----------- | -------------- | ------------------------------------------------ |
| `VITE_GITHUB_TOKEN`  | sim         | —              | Personal Access Token do GitHub                   |
| `VITE_GITHUB_OWNER`  | sim         | —              | Dono do repositório (usuário ou organização)      |
| `VITE_GITHUB_REPO`   | sim         | —              | Nome do repositório                               |
| `VITE_GITHUB_BRANCH` | não         | `main`         | Branch que recebe os commits                      |
| `VITE_GITHUB_PATH`   | não         | `pedidos.json` | Caminho do arquivo dentro do repositório          |

**Permissões do token:**

- Token clássico → escopo `repo`.
- Token fine-grained → acesso ao repositório alvo + permissão **Contents: Read and write**.

O arquivo `pedidos.json` **não precisa existir** de antemão: se não existir, o primeiro commit
cria o arquivo.

> Variáveis `VITE_*` são lidas na inicialização do servidor. Depois de editar o `.env`,
> **reinicie o `npm run dev`**.

## Rodando

```bash
npm run dev
```

Abre em <http://localhost:5173>.

Sem o `.env` configurado o app ainda abre e o wizard funciona normalmente — só não lê nem
grava nada no GitHub, e um aviso aparece na aba de pedidos.

---

## Como funciona o fluxo

### Aba "Montar pedido"

Wizard com ordem fixa:

**Tamanho → Massa → Tipo de massa → Molho → Molho extra → Adicionais → Finalização → Bebida → Revisão**

- Toda etapa começa com um padrão sensato selecionado (ex.: *Sem molho extra*), então nenhuma
  etapa fica vazia e nada é bloqueante.
- O painel **Prato sendo montado** fica visível o tempo todo e cresce a cada etapa.
- O **stepper** no topo permite pular direto para qualquer etapa já visitada, e voltar não
  apaga as escolhas seguintes.
- **Adicionais** usa contador `+ / −` (dá para pedir Bacon x3); **Finalização** é liga/desliga,
  porque repetir um acabamento não faria sentido.
- Na **Revisão**, cada linha tem um "Alterar" que volta direto àquela etapa preservando o resto.
- Salvar dá nome ao pedido e o adiciona à lista **em memória**. Nada vai ao GitHub ainda.

### Aba "Pedidos criados"

- Pedidos agrupados em pastas (um pedido pertence a no máximo uma pasta; os soltos ficam em
  *Sem pasta*).
- CRUD completo de pedidos (criar, editar reabrindo o wizard pré-preenchido, duplicar, excluir)
  e de pastas (criar, renomear, excluir — excluir uma pasta devolve os pedidos dela para
  *Sem pasta*, nunca apaga pedido junto).
- Ordenação **manual por drag-and-drop** (arraste pelo `⠿`, entre posições ou para outra pasta)
  ou automática por nome e data de criação.
- Cada card mostra seu estado: `No GitHub`, `Alterado` ou `Não commitado`.

### Commit

O botão **Salvar e commitar no GitHub** fica fixo no topo, com o número de alterações
pendentes. Ele abre um painel que lista o que mudou, deixa editar a mensagem do commit e só
então:

1. `GET /repos/{owner}/{repo}/contents/{path}` — busca o `sha` atual do arquivo (a API do
   GitHub exige o `sha` para atualizar um arquivo existente).
2. `PUT /repos/{owner}/{repo}/contents/{path}` — envia o JSON novo em base64, gerando **um
   commit**.

Se o `sha` remoto mudou desde que o app carregou (você editou o arquivo por fora, por
exemplo), o commit é recusado com aviso de conflito e você escolhe entre **Recarregar do
GitHub** (descarta o que está local) ou **Sobrescrever** (ignora o que está remoto).

---

## Formato do `pedidos.json`

```json
{
  "versao": 1,
  "atualizadoEm": "2026-09-14T18:20:00.000Z",
  "pastas": [{ "id": "uuid-da-pasta", "nome": "Favoritos" }],
  "pedidos": [
    {
      "id": "uuid-do-pedido",
      "nome": "Penne ao Funghi (Grande)",
      "pastaId": "uuid-da-pasta",
      "criadoEm": "2026-09-14T18:00:00.000Z",
      "atualizadoEm": "2026-09-14T18:10:00.000Z",
      "escolhas": {
        "tamanho": "Grande",
        "massa": "Penne",
        "tipoMassa": "Integral",
        "molho": "Funghi",
        "molhoExtra": "Sem molho extra",
        "adicionais": { "Bacon": 2, "Shimeji": 1 },
        "finalizacao": ["Parmesão ralado", "Azeite trufado"],
        "bebida": "Vinho tinto"
      }
    }
  ]
}
```

A ordem dos arrays **é** a ordem manual mostrada na tela.

Sobre o estado de sincronização: em vez de gravar um campo `sincronizado` no arquivo (que
seria sempre `true` ali dentro, já que o arquivo é a fonte de verdade), o app guarda em memória
uma cópia do que leu do GitHub e compara com o estado atual. Assim o selo de cada card e o
contador de pendências saem sempre corretos, inclusive para exclusões e reordenações.

---

## Estrutura

```
src/
├── components/
│   ├── wizard/
│   │   ├── WizardStepper.jsx        # barra das 9 etapas, clicável
│   │   ├── EtapaSelecaoUnica.jsx    # escolha única (Tamanho, Massa, Molho...)
│   │   ├── EtapaSelecaoMultipla.jsx # múltipla: com contador (Adicionais) ou liga/desliga
│   │   ├── PratoPreview.jsx         # preview incremental do prato
│   │   └── ResumoPedido.jsx         # revisão final + salvar
│   ├── pedidos/
│   │   ├── PedidoCard.jsx           # card de um pedido salvo
│   │   └── PastaList.jsx            # pastas + drag-and-drop
│   └── CommitButton.jsx             # commit no GitHub + status
├── pages/
│   ├── CardapioPage.jsx
│   └── PedidosPage.jsx
├── data/cardapioConfig.js           # todas as opções e a definição das etapas
├── services/githubApi.js            # GET/PUT contents da API do GitHub
├── state/
│   ├── PedidoWizardContext.jsx      # pedido em montagem
│   └── PedidosContext.jsx           # pedidos salvos, pastas, diff e commit
├── App.jsx
├── main.jsx
└── styles.css
```

## Mexendo no cardápio

Tudo que aparece nas etapas vem de [`src/data/cardapioConfig.js`](src/data/cardapioConfig.js).
Para adicionar um molho ou uma bebida, basta incluir a string no array correspondente. Para
criar uma etapa nova, adicione um objeto em `ETAPAS` — o wizard, o preview, o resumo e os cards
são todos gerados a partir dessa lista.

Preços não existem nesta versão (custo zero, nada exibido).
