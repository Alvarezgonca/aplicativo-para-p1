import NetInfo from '@react-native-community/netinfo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mensagemDeErro } from '@/services/api';

/**
 * Busca dados assincronos e controla os estados da tela.
 *
 * Devolve dados, loading e erro, que a tela testa nesta ordem: carregando,
 * erro, vazio e sucesso. A funcao buscar deve ser criada com useCallback; se
 * ela mudar a cada renderizacao, o efeito dispara de novo e as requisicoes
 * entram em laco infinito.
 *
 * buscar recebe o parametro forcar, repassado ao cache: e falso na carga
 * normal e verdadeiro no gesto de puxar para atualizar.
 */
export function useFetch<T>(buscar: (forcar: boolean) => Promise<T>) {
  const [dados, setDados] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);

  /** Cada pedido de recarga incrementa este numero e dispara o efeito de novo. */
  const [versao, setVersao] = useState(0);

  /** Indica se a proxima busca deve ignorar a validade do cache. */
  const forcarProxima = useRef(false);

  /**
   * Numero da requisicao mais recente. Se o usuario trocar de anime antes da
   * resposta anterior chegar, a resposta atrasada e descartada em vez de
   * sobrescrever a tela com dados do titulo errado.
   */
  const ultima = useRef(0);

  useEffect(() => {
    const numero = ++ultima.current;
    const forcar = forcarProxima.current;
    forcarProxima.current = false;

    buscar(forcar)
      .then((resultado) => {
        if (numero === ultima.current) {
          setDados(resultado);
          setErro(null);
        }
      })
      .catch((falha: unknown) => {
        if (numero === ultima.current) {
          setErro(mensagemDeErro(falha));
        }
      })
      .finally(() => {
        if (numero === ultima.current) {
          setLoading(false);
          setAtualizando(false);
        }
      });
  }, [buscar, versao]);

  /**
   * Quando a conexao volta depois de uma queda, a busca e refeita sozinha:
   * uma tela que mostrava erro por falta de rede se recupera sem o usuario
   * precisar tocar em "Tentar de novo".
   */
  useEffect(() => {
    let estavaOffline = false;
    return NetInfo.addEventListener((estado) => {
      const online = estado.isConnected !== false;
      if (online && estavaOffline) {
        setVersao((atual) => atual + 1);
      }
      estavaOffline = !online;
    });
  }, []);

  /** Refaz a busca do zero, com o indicador de carregamento. Usado no "Tentar de novo". */
  const recarregar = useCallback(() => {
    setLoading(true);
    setErro(null);
    setVersao((atual) => atual + 1);
  }, []);

  /** Busca de novo mantendo os dados na tela. Usado no puxar para atualizar. */
  const atualizar = useCallback(() => {
    forcarProxima.current = true;
    setAtualizando(true);
    setVersao((atual) => atual + 1);
  }, []);

  return { dados, loading, erro, atualizando, recarregar, atualizar };
}
