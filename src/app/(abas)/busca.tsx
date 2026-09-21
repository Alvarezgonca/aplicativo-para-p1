import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Cartaz, LarguraCartaz } from '@/componentes/cartaz';
import { AlturaBarraAbas, Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { animes } from '@/dados/animes';

const COLUNAS = 3;

/**
 * Remove acentos e coloca em minusculas, para que a comparacao ignore
 * diferencas de acentuacao e de caixa entre o termo digitado e o catalogo.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export default function TelaBusca() {
  const [termo, setTermo] = useState('');
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
          renderItem={({ item }) => <Cartaz anime={item} largura={LarguraCartaz.grade} />}
          numColumns={COLUNAS}
          columnWrapperStyle={styles.coluna}
          contentContainerStyle={styles.grade}
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
        <View style={styles.vazio}>
          <Ionicons name="search-outline" size={44} color={Cores.textoTerciario} />
          <Text style={styles.vazioTitulo}>O que voce quer assistir?</Text>
          <Text style={styles.vazioTexto}>
            Digite o nome de um anime, de um estudio ou de um genero.
          </Text>
        </View>
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
    paddingBottom: AlturaBarraAbas + Espacamento.xl,
  },
  coluna: { justifyContent: 'space-between', marginBottom: Espacamento.lg },
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
