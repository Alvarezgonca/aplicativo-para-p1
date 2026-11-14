import { useCallback, useEffect, useRef, useState } from 'react';

import { mensagemDeErro } from '@/services/api';
import type { Pagina } from '@/services/tipos';

interface Estado<T> {
  /** A qual consulta pertencem os itens abaixo. Nulo antes da primeira resposta. */
  chave: string | null;
  itens: T[];
  pagina: number;
  temMais: boolean;
  erro: string | null;
}

/**
 * Lista paginada com rolagem infinita.
 *
 * Carrega a primeira pagina sempre que a chave muda (por exemplo, um novo
 * termo de busca) e as seguintes quando a FlatList avisa que o fim da lista
 * esta perto (onEndReached).
 *
 * @param chave identifica a consulta; ao mudar, a lista recomeca da pagina 1.
 * @param buscarPagina deve vir de useCallback. Recebe o numero da pagina e se
 *   o cache deve ser ignorado (puxar para atualizar).
 * @param idDe extrai o identificador do item, usado para descartar repetidos:
 *   a ordem da API pode mudar entre uma pagina e outra e trazer de novo um
 *   item ja exibido, o que quebraria a chave unica da FlatList.
 */
export function usePaginacao<T>(
  chave: string,
  buscarPagina: (pagina: number, forcar: boolean) => Promise<Pagina<T>>,
  idDe: (item: T) => number,
) {
  const [estado, setEstado] = useState<Estado<T>>({
    chave: null,
    itens: [],
    pagina: 0,
    temMais: false,
    erro: null,
  });
  const [versao, setVersao] = useState(0);
  const [atualizando, setAtualizando] = useState(false);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erroMais, setErroMais] = useState<string | null>(null);

  /**
   * Trava contra pedidos repetidos. O onEndReached pode disparar varias
   * vezes seguidas durante a rolagem; sem a trava, a mesma pagina seria
   * pedida duas ou tres vezes.
   */
  const pedindo = useRef(false);

  /** Muda a cada nova consulta, para descartar respostas de consultas antigas. */
  const geracao = useRef(0);

  /** Ignorar o cache na proxima carga da primeira pagina. */
  const forcarProxima = useRef(false);

  useEffect(() => {
    const atual = ++geracao.current;
    const forcar = forcarProxima.current;
    forcarProxima.current = false;
    pedindo.current = true;

    buscarPagina(1, forcar)
      .then((resposta) => {
        if (atual === geracao.current) {
          setEstado({
            chave,
            itens: resposta.itens,
            pagina: 1,
            temMais: resposta.temMais,
            erro: null,
          });
        }
      })
      .catch((falha: unknown) => {
        if (atual === geracao.current) {
          setEstado({ chave, itens: [], pagina: 0, temMais: false, erro: mensagemDeErro(falha) });
        }
      })
      .finally(() => {
        if (atual === geracao.current) {
          pedindo.current = false;
          setAtualizando(false);
          setErroMais(null);
        }
      });
  }, [chave, buscarPagina, versao]);

  /** Verdadeiro enquanto a primeira pagina da consulta atual nao chegou. */
  const loading = estado.chave !== chave;

  const carregarMais = useCallback(() => {
    if (pedindo.current || loading || !estado.temMais) {
      return;
    }
    pedindo.current = true;
    const atual = geracao.current;
    const proxima = estado.pagina + 1;
    setCarregandoMais(true);
    setErroMais(null);

    buscarPagina(proxima, false)
      .then((resposta) => {
        if (atual !== geracao.current) {
          return;
        }
        setEstado((anterior) => {
          const vistos = new Set(anterior.itens.map(idDe));
          const novos = resposta.itens.filter((item) => !vistos.has(idDe(item)));
          return {
            ...anterior,
            itens: [...anterior.itens, ...novos],
            pagina: proxima,
            temMais: resposta.temMais,
          };
        });
      })
      .catch((falha: unknown) => {
        if (atual === geracao.current) {
          setErroMais(mensagemDeErro(falha));
        }
      })
      .finally(() => {
        if (atual === geracao.current) {
          pedindo.current = false;
        }
        setCarregandoMais(false);
      });
  }, [buscarPagina, idDe, estado.pagina, estado.temMais, loading]);

  /** Recomeca do zero, com o indicador de carregamento. */
  const recarregar = useCallback(() => {
    setEstado((anterior) => ({ ...anterior, chave: null }));
    setVersao((atual) => atual + 1);
  }, []);

  /** Puxar para atualizar: busca a primeira pagina sem cache e mantem a lista visivel. */
  const atualizar = useCallback(() => {
    forcarProxima.current = true;
    setAtualizando(true);
    setVersao((atual) => atual + 1);
  }, []);

  return {
    itens: loading ? [] : estado.itens,
    loading,
    erro: loading ? null : estado.erro,
    temMais: estado.temMais,
    carregandoMais,
    erroMais,
    atualizando,
    carregarMais,
    recarregar,
    atualizar,
  };
}
