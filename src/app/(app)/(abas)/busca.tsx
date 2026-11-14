import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import { Carregando, MensagemErro, RodapePaginacao, Vazio } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useDebounce } from '@/hooks/use-debounce';
import { useFetch } from '@/hooks/use-fetch';
import { useLarguraGrade } from '@/hooks/use-largura-grade';
import { usePaginacao } from '@/hooks/use-paginacao';
import { catalogo } from '@/services/anilist';
import { comCache, HORA, MINUTO } from '@/services/cache';
import { storage } from '@/services/storage';
import type { AnimeResumo, Pagina } from '@/services/tipos';

const COLUNAS = 3;
const MINIMO_LETRAS = 2;
const LIMITE_RECENTES = 8;
const CHAVE_RECENTES = 'buscas-recentes';

const idDoAnime = (anime: AnimeResumo) => anime.id;
const paginaVazia: Pagina<AnimeResumo> = { itens: [], temMais: false };

export default function TelaBusca() {
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const alturaAbas = useAlturaBarraAbas();
  const larguraCartaz = useLarguraGrade(COLUNAS);

  const [termo, setTermo] = useState('');
  const [recentes, setRecentes] = useState<string[]>([]);

  /** O texto so vai para a API quando o usuario faz uma pausa de meio segundo. */
  const termoAtrasado = useDebounce(termo.trim(), 500);
  const buscando = termoAtrasado.length >= MINIMO_LETRAS;
  const digitando = termo.trim() !== termoAtrasado;

  /* Buscas recentes: lidas do armazenamento local uma vez, ao abrir a tela. */
  useEffect(() => {
    storage.get<string[]>(CHAVE_RECENTES, []).then(setRecentes);
  }, []);

  /** Coloca o termo no topo das recentes, sem repetir, e grava no aparelho. */
  const lembrarBusca = useCallback((texto: string) => {
    const limpo = texto.trim();
    if (limpo.length < MINIMO_LETRAS) {
      return;
    }
    setRecentes((atuais) => {
      const novas = [limpo, ...atuais.filter((item) => item.toLowerCase() !== limpo.toLowerCase())];
      const cortadas = novas.slice(0, LIMITE_RECENTES);
      storage.set(CHAVE_RECENTES, cortadas);
      return cortadas;
    });
  }, []);

  function limparRecentes() {
    setRecentes([]);
    storage.remove(CHAVE_RECENTES);
  }

  /* Resultados da busca, paginados. */
  const buscarPagina = useCallback(
    (pagina: number, forcar: boolean) => {
      if (termoAtrasado.length < MINIMO_LETRAS) {
        return Promise.resolve(paginaVazia);
      }
      return comCache(
        `busca:${termoAtrasado.toLowerCase()}:${pagina}`,
        () => catalogo.buscar(termoAtrasado, pagina),
        10 * MINUTO,
        forcar,
      );
    },
    [termoAtrasado],
  );
  const resultados = usePaginacao(termoAtrasado, buscarPagina, idDoAnime);

  /* Generos para explorar, que quase nunca mudam: um dia de cache. */
  const buscarGeneros = useCallback(
    (forcar: boolean) => comCache('generos', catalogo.generos, 24 * HORA, forcar),
    [],
  );
  const generos = useFetch(buscarGeneros);

  function renderizarResultados() {
    if (resultados.loading) {
      return <Carregando />;
    }
    if (resultados.erro) {
      return <MensagemErro mensagem={resultados.erro} aoTentarDeNovo={resultados.recarregar} />;
    }
    return (
      <FlatList
        data={resultados.itens}
        keyExtractor={(anime) => String(anime.id)}
        renderItem={({ item }) => (
          <Cartaz
            anime={item}
            largura={larguraCartaz}
            aoPressionar={() => lembrarBusca(termoAtrasado)}
          />
        )}
        numColumns={COLUNAS}
        columnWrapperStyle={styles.coluna}
        contentContainerStyle={[
          styles.grade,
          { paddingBottom: alturaAbas + Espacamento.xl },
          resultados.itens.length === 0 && styles.listaVazia,
        ]}
        onEndReached={resultados.carregarMais}
        onEndReachedThreshold={0.5}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <RodapePaginacao
            carregando={resultados.carregandoMais}
            erro={resultados.erroMais}
            aoTentarDeNovo={resultados.carregarMais}
          />
        }
        ListEmptyComponent={
          <Vazio
            icone="telescope-outline"
            titulo="Nada encontrado"
            texto={`Nenhum título corresponde a "${termoAtrasado}".`}
          />
        }
      />
    );
  }

  return (
    <View style={[styles.container, { paddingTop: recuo.top + Espacamento.sm }]}>
      <View style={styles.campo}>
        <Ionicons name="search" size={18} color={Cores.textoTerciario} />
        <TextInput
          value={termo}
          onChangeText={setTermo}
          onSubmitEditing={() => lembrarBusca(termo)}
          placeholder="Buscar animes"
          placeholderTextColor={Cores.textoTerciario}
          style={styles.entrada}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {digitando ? <ActivityIndicator size="small" color={Cores.textoTerciario} /> : null}
        {termo.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setTermo('')} accessibilityLabel="Limpar busca">
            <Ionicons name="close-circle" size={18} color={Cores.textoTerciario} />
          </Pressable>
        ) : null}
      </View>

      {buscando ? (
        renderizarResultados()
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.exploracao,
            { paddingBottom: alturaAbas + Espacamento.xl },
          ]}
          keyboardShouldPersistTaps="handled">
          {recentes.length > 0 ? (
            <View style={styles.secao}>
              <View style={styles.cabecalhoSecao}>
                <Text style={styles.tituloSecao}>Buscas recentes</Text>
                <Pressable onPress={limparRecentes} hitSlop={8}>
                  <Text style={styles.limpar}>Limpar</Text>
                </Pressable>
              </View>
              {recentes.map((item) => (
                <Pressable
                  key={item}
                  style={({ pressed }) => [styles.recente, pressed && styles.pressionado]}
                  onPress={() => setTermo(item)}>
                  <Ionicons name="time-outline" size={18} color={Cores.textoTerciario} />
                  <Text style={styles.textoRecente}>{item}</Text>
                  <Ionicons
                    name="arrow-up-outline"
                    size={16}
                    color={Cores.textoTerciario}
                    style={styles.seta}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.secao}>
            <Text style={styles.tituloSecao}>Explorar por gênero</Text>
            {generos.loading ? (
              <ActivityIndicator color={Cores.marca} style={styles.carregandoGeneros} />
            ) : generos.erro || !generos.dados ? (
              <Pressable onPress={generos.recarregar}>
                <Text style={styles.erroGeneros}>
                  Não foi possível carregar os gêneros. Tocar para tentar de novo.
                </Text>
              </Pressable>
            ) : (
              <View style={styles.etiquetas}>
                {generos.dados.map((genero) => (
                  <Pressable
                    key={genero.original}
                    onPress={() =>
                      router.push({ pathname: '/genero/[nome]', params: { nome: genero.original } })
                    }
                    style={({ pressed }) => [
                      styles.etiqueta,
                      pressed && styles.etiquetaPressionada,
                    ]}>
                    <Text style={styles.textoEtiqueta}>{genero.nome}</Text>
                  </Pressable>
                ))}
              </View>
            )}
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
  grade: { paddingHorizontal: Espacamento.lg, paddingTop: Espacamento.lg },
  listaVazia: { flexGrow: 1 },
  coluna: { gap: Espacamento.md, marginBottom: Espacamento.lg },
  exploracao: { paddingHorizontal: Espacamento.lg, paddingTop: Espacamento.lg },
  secao: { marginBottom: Espacamento.xl },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tituloSecao: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginBottom: Espacamento.md,
  },
  limpar: {
    color: Cores.marca,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    marginBottom: Espacamento.md,
  },
  recente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingVertical: Espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
  },
  pressionado: { opacity: 0.6 },
  textoRecente: { flex: 1, color: Cores.textoSecundario, fontSize: Fonte.corpo },
  seta: { transform: [{ rotate: '-45deg' }] },
  carregandoGeneros: { alignSelf: 'flex-start', marginTop: Espacamento.sm },
  erroGeneros: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
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
});
