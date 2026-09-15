# Cardápio Interativo

App web pessoal e local para montar pedidos de massa passo a passo estilo Spoleto (9 etapas) e
versionar os pedidos como um `pedidos.json` commitado direto no seu repositório do GitHub. 


## Leia antes de rodar: por que este app é só local

O Vite injeta qualquer variável `VITE_*` **dentro do bundle JavaScript** que vai para o
navegador. O `VITE_GITHUB_TOKEN` fica legível para qualquer pessoa que abra a página ou o arquivo JS gerado.

Isso só é aceitável porque roda **exclusivamente em `localhost`, via `npm run dev`**.

- ❌ Não hospede em Vercel/Netlify/GitHub Pages/qualquer lugar público.
- ❌ Não distribua a pasta `dist/` gerada pelo `npm run build`.
- ❌ Não commite o arquivo `.env` 
- ✅ Se um dia quiser expor o app, o token precisa sair do frontend e ir para um backend
  próprio que faça as chamadas ao GitHub.

Se o token vazar, revogue em <https://github.com/settings/tokens>.


## Instalação

```bash
git clone https://github.com/LaylaTamb/cardapio-massas.git
```

```bash
cd cardapio-massas
```

```bash
npm install
```

```bash
npm run dev
```

Abre em <http://localhost:5173>.

Sem o `.env` configurado o app ainda abre e o wizard funciona normalmente — só não lê nem
grava nada no GitHub, e um aviso aparece na aba de pedidos.


## Fluxo de escolhas

**Tamanho → Massa → Tipo de massa → Molho → Molho extra → Adicionais → Finalização → Bebida → Revisão**

### Commit

O botão **Salvar e commitar no GitHub** fica fixo no topo, com o número de alterações
pendentes. Ele abre um painel que lista o que mudou, deixa editar a mensagem do commit.


## Mexendo no cardápio

Tudo que aparece nas etapas vem de [`src/data/cardapioConfig.js`](src/data/cardapioConfig.js).
Para adicionar um molho ou uma bebida, basta incluir a string no array correspondente. Para
criar uma etapa nova, adicione um objeto em `ETAPAS` — o wizard, o preview, o resumo e os cards
são todos gerados a partir dessa lista.

Preços não existem nesta versão.
