import { useEffect, useRef, useState } from 'react'
import { descricaoDestino, urlDoArquivoNoGitHub } from '../services/githubApi.js'
import { usePedidos } from '../state/PedidosContext.jsx'

function mensagemPadrao(pendencias) {
  if (pendencias.length === 0) return 'Atualiza pedidos'
  if (pendencias.length === 1) return pendencias[0].texto
  const novos = pendencias.filter((p) => p.tipo === 'pedido-novo').length
  const alterados = pendencias.filter((p) => p.tipo === 'pedido-alterado').length
  const removidos = pendencias.filter((p) => p.tipo === 'pedido-removido').length
  const partes = []
  if (novos) partes.push(`${novos} novo${novos > 1 ? 's' : ''}`)
  if (alterados) partes.push(`${alterados} alterado${alterados > 1 ? 's' : ''}`)
  if (removidos) partes.push(`${removidos} removido${removidos > 1 ? 's' : ''}`)
  return partes.length ? `Atualiza pedidos: ${partes.join(', ')}` : 'Atualiza organização dos pedidos'
}

/** Botão "Salvar e commitar no GitHub" + painel com o que está pendente. */
export default function CommitButton() {
  const {
    pendencias,
    statusCommit,
    commitar,
    carregar,
    carregando,
    semConfiguracao,
    erroCarregamento,
    limparStatusCommit,
  } = usePedidos()

  const [aberto, setAberto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [mensagemTocada, setMensagemTocada] = useState(false)
  const containerRef = useRef(null)

  const total = pendencias.length
  const enviando = statusCommit.estado === 'enviando'
  const conflito = statusCommit.estado === 'erro' && statusCommit.tipo === 'conflito'
  const bloqueado = semConfiguracao || Boolean(erroCarregamento && erroCarregamento.tipo !== 'config')

  useEffect(() => {
    if (!mensagemTocada) setMensagem(mensagemPadrao(pendencias))
  }, [pendencias, mensagemTocada])

  // Fecha o painel ao clicar fora.
  useEffect(() => {
    if (!aberto) return undefined
    function aoClicar(evento) {
      if (containerRef.current && !containerRef.current.contains(evento.target)) setAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [aberto])

  async function enviar(forcar = false) {
    try {
      await commitar({ mensagem, forcar })
      setMensagemTocada(false)
    } catch {
      // O erro já vira estado em statusCommit; nada a fazer aqui.
    }
  }

  return (
    <div className="commit" ref={containerRef}>
      <button
        type="button"
        className={`botao botao--commit ${total > 0 ? 'botao--commit-pendente' : ''}`}
        onClick={() => setAberto((valor) => !valor)}
        disabled={carregando}
        aria-expanded={aberto}
        title={
          bloqueado
            ? 'Configure o .env para commitar'
            : total === 0
              ? 'Nada pendente de commit'
              : `${total} alteração(ões) pendente(s)`
        }
      >
        <span aria-hidden="true">⬆</span>
        <span>Salvar e commitar no GitHub</span>
        <span className={`commit__contador ${total > 0 ? 'commit__contador--ativo' : ''}`}>
          {carregando ? '…' : total}
        </span>
      </button>

      {aberto && (
        <div className="commit__painel" role="dialog" aria-label="Commit no GitHub">
          <header className="commit__cabecalho">
            <strong>Destino</strong>
            <code className="commit__destino">{descricaoDestino()}</code>
          </header>

          {bloqueado ? (
            <p className="alerta alerta--erro">
              {erroCarregamento?.mensagem ||
                'Preencha VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER e VITE_GITHUB_REPO no .env e reinicie o servidor.'}
            </p>
          ) : (
            <>
              <div className="commit__pendencias">
                <strong>
                  {total === 0
                    ? 'Nada pendente'
                    : `${total} altera${total === 1 ? 'ção' : 'ções'} pendente${total === 1 ? '' : 's'}`}
                </strong>
                {total > 0 && (
                  <ul>
                    {pendencias.slice(0, 8).map((pendencia, indice) => (
                      <li key={`${pendencia.tipo}-${indice}`} className={`pendencia pendencia--${pendencia.tipo}`}>
                        {pendencia.texto}
                      </li>
                    ))}
                    {total > 8 && <li className="pendencia">…e mais {total - 8}.</li>}
                  </ul>
                )}
              </div>

              <label className="rotulo">
                Mensagem do commit
                <input
                  className="campo"
                  value={mensagem}
                  onChange={(evento) => {
                    setMensagem(evento.target.value)
                    setMensagemTocada(true)
                  }}
                  disabled={enviando}
                />
              </label>

              <div className="commit__acoes">
                <button
                  type="button"
                  className="botao botao--primario"
                  onClick={() => enviar(false)}
                  disabled={enviando || total === 0}
                >
                  {enviando ? 'Commitando…' : 'Commitar agora'}
                </button>
                <button
                  type="button"
                  className="botao botao--fantasma"
                  onClick={() => {
                    limparStatusCommit()
                    carregar()
                  }}
                  disabled={enviando}
                  title="Descarta as alterações locais e relê o pedidos.json do GitHub"
                >
                  Recarregar do GitHub
                </button>
              </div>

              {statusCommit.estado === 'sucesso' && (
                <p className="alerta alerta--sucesso">
                  {statusCommit.criouArquivo ? 'Arquivo criado' : 'Commit feito'} com sucesso.{' '}
                  <a href={statusCommit.commitUrl} target="_blank" rel="noreferrer">
                    Ver commit
                  </a>
                </p>
              )}

              {statusCommit.estado === 'erro' && (
                <div className="alerta alerta--erro">
                  <p>{statusCommit.mensagem}</p>
                  {conflito && (
                    <button
                      type="button"
                      className="botao botao--perigo botao--pequeno"
                      onClick={() => enviar(true)}
                      disabled={enviando}
                    >
                      Sobrescrever o que está no GitHub
                    </button>
                  )}
                </div>
              )}

              <a
                className="commit__link"
                href={urlDoArquivoNoGitHub()}
                target="_blank"
                rel="noreferrer"
              >
                Abrir o arquivo no GitHub ↗
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
