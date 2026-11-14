import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { BarraProgresso } from '@/componentes/barra-progresso';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { FRACAO_CONCLUIDO, type RegistroHistorico } from '@/contextos/historico';

/** Quantos episodios a fileira mostra no maximo. */
const LIMITE_FILEIRA = 10;

/**
 * Cartao horizontal da fileira de continuidade.
 *
 * Diferente do cartaz vertical, usa a miniatura horizontal do episodio e leva
 * direto para a reproducao, sem passar pela tela de detalhe.
 */
export function CartaoContinuar({ registro }: { registro: RegistroHistorico }) {
  const router = useRouter();
  const minutosRestantes = Math.max(1, Math.round(registro.duracao * (1 - registro.progresso)));

  return (
    <Pressable
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      onPress={() =>
        router.push({
          pathname: '/player/[animeId]',
          params: { animeId: registro.animeId, episodio: registro.episodio },
        })
      }>
      <View style={styles.moldura}>
        <Image
          source={registro.miniatura ?? registro.banner ?? registro.capa}
          style={styles.imagem}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.iconePlay}>
          <Ionicons name="play" size={18} color={Cores.texto} />
        </View>
        <View style={styles.progresso}>
          <BarraProgresso progresso={registro.progresso} />
        </View>
      </View>

      <Text style={styles.titulo} numberOfLines={1}>
        {registro.titulo}
      </Text>
      <Text style={styles.detalhe} numberOfLines={1}>
        E{registro.episodio} · faltam {minutosRestantes} min
      </Text>
    </Pressable>
  );
}

/**
 * Escolhe o que entra na fileira: o episodio mais recente de cada anime,
 * desde que ainda nao tenha terminado. Os registros ja chegam do mais novo
 * para o mais antigo, entao o primeiro de cada anime e o que vale.
 */
function emAndamento(registros: RegistroHistorico[]): RegistroHistorico[] {
  const vistos = new Set<number>();
  const resultado: RegistroHistorico[] = [];
  for (const registro of registros) {
    if (vistos.has(registro.animeId)) {
      continue;
    }
    vistos.add(registro.animeId);
    if (registro.progresso < FRACAO_CONCLUIDO) {
      resultado.push(registro);
    }
  }
  return resultado.slice(0, LIMITE_FILEIRA);
}

/** Fileira "Continuar assistindo" da tela inicial; some quando nao ha nada pela metade. */
export function ContinuarAssistindo({ registros }: { registros: RegistroHistorico[] }) {
  const router = useRouter();
  const itens = emAndamento(registros);
  if (itens.length === 0) {
    return null;
  }

  return (
    <View style={styles.secao}>
      <View style={styles.cabecalhoSecao}>
        <Text style={styles.tituloSecao}>Continuar assistindo</Text>
        <Pressable style={styles.verTudo} onPress={() => router.push('/historico')} hitSlop={8}>
          <Text style={styles.textoVerTudo}>Histórico</Text>
          <Ionicons name="chevron-forward" size={16} color={Cores.marca} />
        </Pressable>
      </View>
      <FlatList
        data={itens}
        keyExtractor={(item) => `${item.animeId}-${item.episodio}`}
        renderItem={({ item }) => <CartaoContinuar registro={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fileira}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  secao: { marginTop: Espacamento.xl },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.lg,
    marginBottom: Espacamento.md,
  },
  tituloSecao: { color: Cores.texto, fontSize: Fonte.titulo, fontWeight: '700' },
  verTudo: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  textoVerTudo: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '700' },
  fileira: { paddingHorizontal: Espacamento.lg },
  separador: { width: Espacamento.md },
  cartao: { width: 220 },
  pressionado: { opacity: 0.7 },
  moldura: {
    width: '100%',
    height: 124,
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagem: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  iconePlay: {
    width: 40,
    height: 40,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progresso: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
    marginTop: Espacamento.sm,
  },
  detalhe: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    marginTop: 2,
  },
});
