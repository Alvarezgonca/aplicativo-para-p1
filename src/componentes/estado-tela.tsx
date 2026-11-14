import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';

type NomeIcone = keyof typeof Ionicons.glyphMap;

/*
 * Estados de uma tela que depende de dados externos.
 *
 * Toda tela que busca dados passa por quatro estados: carregando, erro, vazio
 * e sucesso. Os tres primeiros tem a mesma cara em todo o aplicativo, entao
 * ficam aqui e cada tela so decide qual deles exibir, sempre nesta ordem:
 * carregando, depois erro, depois vazio e por fim o conteudo. Assim nunca
 * aparecem dois estados ao mesmo tempo e nunca sobra uma tela em branco.
 */

export function Carregando({ mensagem }: { mensagem?: string }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={Cores.marca} />
      {mensagem ? <Text style={styles.texto}>{mensagem}</Text> : null}
    </View>
  );
}

interface PropsErro {
  mensagem: string;
  /** Quando informado, exibe o botao para refazer a requisicao. */
  aoTentarDeNovo?: () => void;
}

export function MensagemErro({ mensagem, aoTentarDeNovo }: PropsErro) {
  return (
    <View style={styles.centro}>
      <Ionicons name="cloud-offline-outline" size={48} color={Cores.textoTerciario} />
      <Text style={styles.titulo}>Algo deu errado</Text>
      <Text style={styles.texto}>{mensagem}</Text>
      {aoTentarDeNovo ? (
        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
          onPress={aoTentarDeNovo}>
          <Ionicons name="refresh" size={16} color={Cores.texto} />
          <Text style={styles.textoBotao}>Tentar de novo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface PropsVazio {
  titulo: string;
  texto?: string;
  icone?: NomeIcone;
}

export function Vazio({ titulo, texto, icone = 'file-tray-outline' }: PropsVazio) {
  return (
    <View style={styles.centro}>
      <Ionicons name={icone} size={48} color={Cores.textoTerciario} />
      <Text style={styles.titulo}>{titulo}</Text>
      {texto ? <Text style={styles.texto}>{texto}</Text> : null}
    </View>
  );
}

interface PropsRodape {
  carregando: boolean;
  erro: string | null;
  aoTentarDeNovo: () => void;
}

/**
 * Rodape das listas paginadas: indicador enquanto a proxima pagina chega e,
 * se ela falhar, um aviso com a opcao de tentar de novo sem perder o que ja
 * foi carregado.
 */
export function RodapePaginacao({ carregando, erro, aoTentarDeNovo }: PropsRodape) {
  if (carregando) {
    return (
      <View style={styles.rodape}>
        <ActivityIndicator color={Cores.marca} />
      </View>
    );
  }
  if (erro) {
    return (
      <Pressable style={styles.rodape} onPress={aoTentarDeNovo}>
        <Text style={styles.texto}>{erro}</Text>
        <Text style={styles.link}>Tocar para tentar de novo</Text>
      </Pressable>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  rodape: { paddingVertical: Espacamento.xl, alignItems: 'center', gap: Espacamento.xs },
  link: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    paddingHorizontal: Espacamento.xxl,
    paddingVertical: Espacamento.xxl,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginTop: Espacamento.sm,
    textAlign: 'center',
  },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    lineHeight: 20,
    textAlign: 'center',
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.xl,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
});
