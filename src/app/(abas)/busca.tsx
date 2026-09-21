import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cartaz } from '@/componentes/cartaz';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useLarguraGrade } from '@/hooks/use-largura-grade';
import { animes } from '@/dados/animes';
import { generosDisponiveis } from '@/dados/colecoes';

const COLUNAS = 3;

/**
 * Remove acentos e coloca em minusculas, para que a comparacao ignore
 * diferencas de acentuacao e de caixa entre o termo digitado e o catalogo.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function TelaBusca() {
  const [termo, setTermo] = useState('');
  const alturaAbas = useAlturaBarraAbas();
  const larguraCartaz = useLarguraGrade(COLUNAS);
  const recuo = useSafeAreaInsets();

  /**
   * O filtro roda apenas quando o termo muda. Sem useMemo, a lista seria
   * recalculada em toda renderizacao, inclusive nas que nao alteram a busca.
   */
  const resultados = useMemo(() => {
    const alvo = normalizar(termo);
    if (alvo.length === 0) {
      return [];
    }
    return animes.filter((anime) => {
      const campos = [anime.titulo, anime.tituloOriginal, anime.estudio, ...anime.generos];
      return campos.some((campo) => normalizar(campo).includes(alvo));
    });
  }, [termo]);

  const buscando = termo.trim().length > 0;

  return (
    <View style={[styles.container, { paddingTop: recuo.top + Espacamento.sm }]}>
      <View style={styles.campo}>
        <Ionicons name="search" size={18} color={Cores.textoTerciario} />
        <TextInput
          value={termo}
          onChangeText={setTermo}
          placeholder="Buscar por titulo, estudio ou genero"
          placeholderTextColor={Cores.textoTerciario}
          style={styles.entrada}
          autoCorrect={false}
          returnKeyType="search"
        />
        {buscando ? (
          <Pressable hitSlop={8} onPress={() => setTermo('')}>
            <Ionicons name="close-circle" size={18} color={Cores.textoTerciario} />
          </Pressable>
        ) : null}
      </View>

      {buscando ? (
        <FlatList
          data={resultados}
          keyExtractor={(anime) => String(anime.id)}
          renderItem={({ item }) => <Cartaz anime={item} largura={larguraCartaz} />}
          numColumns={COLUNAS}
          columnWrapperStyle={styles.coluna}
          contentContainerStyle={[styles.grade, { paddingBottom: alturaAbas + Espacamento.xl }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.contagem}>
              {resultados.length === 1
                ? '1 resultado'
                : `${resultados.length} resultados`}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.vazio}>
              <Ionicons name="telescope-outline" size={44} color={Cores.textoTerciario} />
              <Text style={styles.vazioTitulo}>Nada encontrado</Text>
              <Text style={styles.vazioTexto}>
                Nenhum titulo corresponde a &quot;{termo.trim()}&quot;.
              </Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.exploracao, { paddingBottom: alturaAbas + Espacamento.xl }]}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.tituloExploracao}>Explorar por genero</Text>
          <View style={styles.etiquetas}>
            {generosDisponiveis.map((genero) => (
              <Pressable
                key={genero}
                onPress={() => setTermo(genero)}
                style={({ pressed }) => [styles.etiqueta, pressed && styles.etiquetaPressionada]}>
                <Text style={styles.textoEtiqueta}>{genero}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.superficie,
    marginHorizontal: Espacamento.lg,
    paddingHorizontal: Espacamento.md,
    height: 44,
    borderRadius: Raio.md,
  },
  entrada: {
    flex: 1,
    color: Cores.texto,
    fontSize: Fonte.corpo,
    padding: 0,
  },
  contagem: {
    color: Cores.textoTerciario,
    fontSize: Fonte.pequena,
    marginBottom: Espacamento.md,
  },
  grade: {
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.lg,
  },
  coluna: { gap: Espacamento.md, marginBottom: Espacamento.xl },
  exploracao: {
    paddingHorizontal: Espacamento.lg,
    paddingTop: Espacamento.xl,
  },
  tituloExploracao: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginBottom: Espacamento.lg,
  },
  etiquetas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.sm,
  },
  etiqueta: {
    backgroundColor: Cores.superficie,
    borderWidth: 1,
    borderColor: Cores.divisoria,
    paddingVertical: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    borderRadius: Raio.pilula,
  },
  etiquetaPressionada: { backgroundColor: Cores.superficieAlta },
  textoEtiqueta: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '600',
  },
  vazio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Espacamento.xxl,
    paddingTop: Espacamento.xxl,
    gap: Espacamento.sm,
  },
  vazioTitulo: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
  vazioTexto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    textAlign: 'center',
    lineHeight: 20,
  },
});
