import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Informa se o aparelho tem conexao de rede.
 *
 * O NetInfo avisa sempre que a conexao muda (Wi-Fi, dados moveis, modo
 * aviao). O retorno do addEventListener e a funcao que cancela a inscricao;
 * devolve-la no useEffect evita que o ouvinte continue ativo depois que o
 * componente sai da tela.
 *
 * Estar conectado nao garante que a API responda: o aviso so diz que nao ha
 * rede nenhuma. Falhas da API continuam tratadas em cada tela.
 */
export function useConexao(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const parar = NetInfo.addEventListener((estado) => {
      // isConnected e nulo enquanto o sistema ainda nao sabe; so conta como
      // offline quando o sistema afirma que nao ha conexao.
      setOnline(estado.isConnected !== false);
    });
    return parar;
  }, []);

  return online;
}
