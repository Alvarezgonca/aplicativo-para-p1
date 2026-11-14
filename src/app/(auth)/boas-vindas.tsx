import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useSessao } from '@/contextos/sessao';

type NomeIcone = keyof typeof Ionicons.glyphMap;

interface Pagina {
  icone: NomeIcone;
  titulo: string;
  texto: string;
}

const PAGINAS: Pagina[] = [
  {
    icone: 'film-outline',
    titulo: 'Todo o catálogo na palma da mão',
    texto:
      'Milhares de animes com sinopse, episódios, personagens e recomendações, sempre atualizados.',
  },
  {
    icone: 'calendar-outline',
    titulo: 'Simulcast no seu horário',
    texto: 'Veja o que estreia a cada dia da semana, já convertido para o fuso do seu aparelho.',
  },
  {
    icone: 'bookmark-outline',
    titulo: 'Sua lista vai com você',
    texto: 'Lista, progresso e preferências ficam salvos no aparelho e funcionam até sem internet.',
  },
];

/**
 * Apresentacao exibida so no primeiro uso.
 *
 * As paginas sao uma FlatList horizontal com pagingEnabled: cada item ocupa a
 * largura da tela e a rolagem para sempre em uma pagina inteira. Ao terminar
 * (ou pular), a marca de "ja visto" vai para o armazenamento local e o
 * router.replace troca esta tela pela proxima, sem deixa-la na pilha.
 */
export default function TelaBoasVindas() {
  const router = useRouter();
  const { concluirBoasVindas } = useSessao();
  const recuo = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const lista = useRef<FlatList<Pagina>>(null);
  const [indice, setIndice] = useState(0);
  // A lista horizontal nao estica as paginas na vertical: a altura disponivel
  // e medida no onLayout e repassada a cada pagina para centralizar o texto.
  const [alturaLista, setAlturaLista] = useState(0);

  const ultima = indice === PAGINAS.length - 1;

  function aoTerminarRolagem(evento: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndice(Math.round(evento.nativeEvent.contentOffset.x / width));
  }

  async function concluir() {
    await concluirBoasVindas();
    router.replace('/entrar');
  }

  function avancar() {
    if (ultima) {
      concluir();
      return;
    }
    lista.current?.scrollToIndex({ index: indice + 1 });
    setIndice(indice + 1);
  }

  return (
    <LinearGradient
      colors={[Cores.marcaEscura, '#3A1A06', Cores.fundo]}
      locations={[0, 0.35, 0.8]}
      style={[styles.container, { paddingTop: recuo.top, paddingBottom: recuo.bottom }]}>
      <View style={styles.topo}>
        <Text style={styles.logo}>crunchyroll</Text>
        {ultima ? null : (
          <Pressable onPress={concluir} hitSlop={10}>
            <Text style={styles.pular}>Pular</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        ref={lista}
        data={PAGINAS}
        keyExtractor={(pagina) => pagina.titulo}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={aoTerminarRolagem}
        onLayout={(evento) => setAlturaLista(evento.nativeEvent.layout.height)}
        style={styles.lista}
        getItemLayout={(_, posicao) => ({ length: width, offset: width * posicao, index: posicao })}
        renderItem={({ item }) => (
          <View style={[styles.pagina, { width, height: alturaLista }]}>
            <View style={styles.circulo}>
              <Ionicons name={item.icone} size={64} color={Cores.marca} />
            </View>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.texto}>{item.texto}</Text>
          </View>
        )}
      />

      <View style={styles.rodape}>
        <View style={styles.pontos}>
          {PAGINAS.map((pagina, posicao) => (
            <View
              key={pagina.titulo}
              style={[styles.ponto, posicao === indice && styles.pontoAtivo]}
            />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
          onPress={avancar}>
          <Text style={styles.textoBotao}>{ultima ? 'Começar' : 'Próximo'}</Text>
          <Ionicons name={ultima ? 'checkmark' : 'arrow-forward'} size={18} color={Cores.texto} />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.xl,
    paddingTop: Espacamento.lg,
  },
  logo: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800', letterSpacing: -0.5 },
  pular: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '600', opacity: 0.85 },
  lista: { flex: 1 },
  pagina: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espacamento.xxl,
    gap: Espacamento.lg,
  },
  circulo: {
    width: 140,
    height: 140,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 2,
    borderColor: 'rgba(244,117,33,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espacamento.lg,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    textAlign: 'center',
    lineHeight: 22,
  },
  rodape: {
    paddingHorizontal: Espacamento.xl,
    paddingBottom: Espacamento.xl,
    gap: Espacamento.xl,
  },
  pontos: { flexDirection: 'row', justifyContent: 'center', gap: Espacamento.sm },
  ponto: {
    width: 8,
    height: 8,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.divisoria,
  },
  pontoAtivo: { width: 24, backgroundColor: Cores.marca },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.lg,
    borderRadius: Raio.sm,
  },
  pressionado: { opacity: 0.8 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
});
