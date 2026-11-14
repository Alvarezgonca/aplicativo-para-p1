import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useSessao } from '@/contextos/sessao';
import { storage } from '@/services/storage';
import type { AnimeResumo } from '@/services/tipos';

/** Um titulo salvo, com o momento em que entrou na lista. */
export interface ItemLista extends AnimeResumo {
  salvoEm: number;
}

interface ValorContexto {
  /** Titulos salvos, do mais recente para o mais antigo. */
  itens: ItemLista[];
  /** Falso enquanto a lista gravada ainda esta sendo lida do aparelho. */
  carregado: boolean;
  estaSalvo: (id: number) => boolean;
  alternar: (anime: AnimeResumo) => void;
  remover: (id: number) => void;
}

const Contexto = createContext<ValorContexto | undefined>(undefined);

/**
 * Inicio da chave no armazenamento local. O id do usuario e acrescentado no
 * fim, entao cada conta que entra neste aparelho tem a propria lista.
 */
const CHAVE = 'minha-lista';

/**
 * Copia so os campos do resumo. A tela de detalhe entrega um AnimeDetalhe,
 * com episodios, personagens e recomendacoes; gravar tudo isso encheria o
 * armazenamento sem necessidade, ja que a lista so mostra o cartaz.
 */
function resumir(anime: AnimeResumo): AnimeResumo {
  return {
    id: anime.id,
    titulo: anime.titulo,
    tituloRomaji: anime.tituloRomaji,
    tituloNativo: anime.tituloNativo,
    capa: anime.capa,
    capaGrande: anime.capaGrande,
    banner: anime.banner,
    cor: anime.cor,
    nota: anime.nota,
    generos: anime.generos,
    ano: anime.ano,
    totalEpisodios: anime.totalEpisodios,
    formato: anime.formato,
  };
}

/**
 * Guarda a lista de animes salvos e a mantem entre aberturas do aplicativo.
 *
 * O botao de salvar fica no detalhe e a exibicao na aba Minha lista. Como sao
 * telas diferentes, o estado vive aqui, acima de ambas na arvore, e chega a
 * elas pelo contexto. O estado em memoria e a copia de trabalho; o
 * AsyncStorage e a copia que sobrevive ao fechamento do aplicativo.
 *
 * Os dados do anime sao gravados junto com o identificador, e nao so o
 * identificador: assim a lista abre na hora e funciona mesmo sem internet.
 *
 * A lista pertence ao usuario logado. Quando a sessao muda (entrar, sair ou
 * trocar de conta), a chave muda e a lista do novo dono e lida do disco.
 */
export function ProvedorMinhaLista({ children }: { children: ReactNode }) {
  const { usuario } = useSessao();
  const chave = usuario ? `${CHAVE}:${usuario.id}` : null;

  // O estado guarda de qual chave veio a lista: enquanto a lista do novo
  // dono nao chega, a do dono anterior nao e exibida.
  const [estado, setEstado] = useState<{ chave: string | null; itens: ItemLista[] }>({
    chave: null,
    itens: [],
  });

  useEffect(() => {
    if (!chave) {
      return;
    }
    let ativo = true;
    storage.get<ItemLista[]>(chave, []).then((lidos) => {
      if (!ativo) {
        return;
      }
      // O conteudo vem do disco e pode estar num formato antigo.
      const validos = Array.isArray(lidos)
        ? lidos.filter((item) => typeof item?.id === 'number')
        : [];
      setEstado({ chave, itens: validos });
    });
    // Se a sessao mudar antes da leitura terminar, a resposta antiga e ignorada.
    return () => {
      ativo = false;
    };
  }, [chave]);

  const carregado = chave === null || estado.chave === chave;
  const itens = useMemo(
    () => (chave !== null && estado.chave === chave ? estado.itens : []),
    [chave, estado],
  );

  /** Atualiza a memoria e grava a nova lista no aparelho. */
  const salvarLista = useCallback(
    (novos: ItemLista[]) => {
      if (!chave) {
        return;
      }
      setEstado({ chave, itens: novos });
      storage.set(chave, novos);
    },
    [chave],
  );

  const alternar = useCallback(
    (anime: AnimeResumo) => {
      if (!carregado) {
        return;
      }
      const jaSalvo = itens.some((item) => item.id === anime.id);
      salvarLista(
        jaSalvo
          ? itens.filter((item) => item.id !== anime.id)
          : [{ ...resumir(anime), salvoEm: Date.now() }, ...itens],
      );
    },
    [itens, carregado, salvarLista],
  );

  const remover = useCallback(
    (id: number) => salvarLista(itens.filter((item) => item.id !== id)),
    [itens, salvarLista],
  );

  const valor = useMemo<ValorContexto>(
    () => ({
      itens,
      carregado,
      estaSalvo: (id: number) => itens.some((item) => item.id === id),
      alternar,
      remover,
    }),
    [itens, carregado, alternar, remover],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

/**
 * Acessa a lista salva. Lanca erro quando usado fora do provedor, de modo que
 * o problema apareca na montagem e nao como um valor indefinido silencioso.
 */
export function useMinhaLista(): ValorContexto {
  const valor = useContext(Contexto);
  if (!valor) {
    throw new Error('useMinhaLista precisa estar dentro de ProvedorMinhaLista.');
  }
  return valor;
}
