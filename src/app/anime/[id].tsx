import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LinhaEpisodio } from '@/componentes/linha-episodio';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useMinhaLista } from '@/contextos/minha-lista';
import { buscarAnimePorId } from '@/dados/animes';
import { listarEpisodios, proximoEpisodio } from '@/dados/episodios';

const ALTURA_BANNER = Math.round(Dimensions.get('window').height * 0.38);

export default function TelaDetalhe() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const { estaSalvo, alternar } = useMinhaLista();
  const [sinopseExpandida, setSinopseExpandida] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState<'episodios' | 'sobre'>('episodios');

  const anime = buscarAnimePorId(Number(id));

  // A rota e dinamica e pode receber um identificador invalido pela URL.
  if (!anime) {
    return (
      <View style={styles.naoEncontrado}>
        <Ionicons name="alert-circle-outline" size={48} color={Cores.textoTerciario} />
        <Text style={styles.textoNaoEncontrado}>Titulo nao encontrado.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.linkVoltar}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const salvo = estaSalvo(anime.id);
  const episodio = proximoEpisodio(anime);
  const episodios = listarEpisodios(anime.id);

  return (
    <View style={styles.container}>
      <FlatList
        data={abaAtiva === 'episodios' ? episodios : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listaEpisodios}>
            <LinhaEpisodio episodio={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.conteudo}
        ItemSeparatorComponent={() => <View style={styles.separador} />}
        ListHeaderComponent={
      <>
        <View style={styles.banner}>
          <Image source={anime.banner} style={styles.imagemBanner} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent', Cores.fundo]}
            locations={[0, 0.45, 1]}
            style={styles.degrade}
          />
        </View>

        <View style={styles.corpo}>
          <Text style={styles.titulo}>{anime.titulo}</Text>
          <Text style={styles.tituloOriginal}>{anime.tituloOriginal}</Text>

          <View style={styles.metadados}>
            <Ionicons name="star" size={13} color={Cores.dourado} />
            <Text style={styles.metaDestaque}>{anime.nota.toFixed(1)}</Text>
            <Text style={styles.metaSeparador}>·</Text>
            <Text style={styles.meta}>{anime.ano}</Text>
            <Text style={styles.metaSeparador}>·</Text>
            <Text style={styles.meta}>{anime.totalEpisodios} episodios</Text>
            <Text style={styles.metaSeparador}>·</Text>
            <Text style={styles.meta}>{anime.duracaoMedia} min</Text>
          </View>

          <View style={styles.generos}>
            {anime.generos.map((genero) => (
              <Selo key={genero} texto={genero} variante="contorno" />
            ))}
            {anime.dublado ? <Selo texto="Dublado" variante="marca" /> : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.botaoAssistir, pressed && styles.pressionado]}
            onPress={() =>
              episodio &&
              router.push({
                pathname: '/player/[episodioId]',
                params: { episodioId: episodio.id },
              })
            }>
            <Ionicons name="play" size={18} color={Cores.texto} />
            <Text style={styles.textoAssistir}>
              {episodio && episodio.progresso > 0
                ? `Continuar E${episodio.numero}`
                : 'Assistir E1'}
            </Text>
          </Pressable>

          <View style={styles.acoesSecundarias}>
            <Pressable style={styles.acao} onPress={() => alternar(anime.id)}>
              <Ionicons
                name={salvo ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={salvo ? Cores.marca : Cores.texto}
              />
              <Text style={[styles.textoAcao, salvo && styles.textoAcaoAtiva]}>
                {salvo ? 'Na lista' : 'Minha lista'}
              </Text>
            </Pressable>

            <Pressable style={styles.acao}>
              <Ionicons name="share-social-outline" size={22} color={Cores.texto} />
              <Text style={styles.textoAcao}>Compartilhar</Text>
            </Pressable>

            <Pressable style={styles.acao}>
              <Ionicons name="download-outline" size={22} color={Cores.texto} />
              <Text style={styles.textoAcao}>Baixar</Text>
            </Pressable>
          </View>

          <View style={styles.abas}>
            {(['episodios', 'sobre'] as const).map((aba) => (
              <Pressable
                key={aba}
                style={[styles.aba, abaAtiva === aba && styles.abaAtiva]}
                onPress={() => setAbaAtiva(aba)}>
                <Text style={[styles.textoAba, abaAtiva === aba && styles.textoAbaAtiva]}>
                  {aba === 'episodios' ? `Episodios (${anime.totalEpisodios})` : 'Sobre'}
                </Text>
              </Pressable>
            ))}
          </View>

          {abaAtiva === 'sobre' ? (
            <View style={styles.sobre}>
              <Pressable onPress={() => setSinopseExpandida((atual) => !atual)}>
                <Text
                  style={styles.sinopse}
                  numberOfLines={sinopseExpandida ? undefined : 4}>
                  {anime.sinopse}
                </Text>
                <Text style={styles.verMais}>
                  {sinopseExpandida ? 'Ver menos' : 'Ver mais'}
                </Text>
              </Pressable>

              {[
                ['Estudio', anime.estudio],
                ['Ano de estreia', String(anime.ano)],
                ['Episodios', String(anime.totalEpisodios)],
                ['Duracao media', `${anime.duracaoMedia} min`],
                ['Audio', anime.dublado ? 'Legendado e dublado' : 'Legendado'],
              ].map(([rotulo, valor]) => (
                <View key={rotulo} style={styles.ficha}>
                  <Text style={styles.fichaRotulo}>{rotulo}</Text>
                  <Text style={styles.fichaValor}>{valor}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </>
        }
      />

      {/* Botao de voltar sobreposto, ja que a pilha esconde o cabecalho. */}
      <Pressable
        style={[styles.voltar, { top: recuo.top + Espacamento.sm }]}
        onPress={() => router.back()}
        hitSlop={10}>
        <Ionicons name="arrow-back" size={22} color={Cores.texto} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { paddingBottom: Espacamento.xxl },
  listaEpisodios: { paddingHorizontal: Espacamento.lg },
  naoEncontrado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.md,
    backgroundColor: Cores.fundo,
  },
  textoNaoEncontrado: { color: Cores.textoSecundario, fontSize: Fonte.corpo },
  linkVoltar: { color: Cores.marca, fontSize: Fonte.corpo, fontWeight: '700' },
  banner: { height: ALTURA_BANNER, backgroundColor: Cores.superficie },
  imagemBanner: { width: '100%', height: '100%' },
  degrade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  corpo: { paddingHorizontal: Espacamento.lg, marginTop: -Espacamento.xl },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    lineHeight: 33,
  },
  tituloOriginal: {
    color: Cores.textoTerciario,
    fontSize: Fonte.pequena,
    marginTop: Espacamento.xs,
  },
  metadados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.xs,
    marginTop: Espacamento.md,
  },
  meta: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  metaDestaque: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  metaSeparador: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  generos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Espacamento.xs,
    marginTop: Espacamento.md,
  },
  botaoAssistir: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.marca,
    paddingVertical: Espacamento.md + 2,
    borderRadius: Raio.sm,
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoAssistir: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  acoesSecundarias: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Espacamento.lg,
  },
  acao: { alignItems: 'center', gap: Espacamento.xs, paddingVertical: Espacamento.sm },
  textoAcao: { color: Cores.textoSecundario, fontSize: Fonte.minuscula, fontWeight: '600' },
  textoAcaoAtiva: { color: Cores.marca },
  sinopse: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    lineHeight: 22,
    marginTop: Espacamento.lg,
  },
  verMais: {
    color: Cores.marca,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
  separador: {
    height: 1,
    backgroundColor: Cores.divisoria,
    marginHorizontal: Espacamento.lg,
  },
  abas: {
    flexDirection: 'row',
    gap: Espacamento.xl,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
    marginTop: Espacamento.xl,
  },
  aba: { paddingBottom: Espacamento.md },
  abaAtiva: { borderBottomWidth: 2, borderBottomColor: Cores.marca },
  textoAba: {
    color: Cores.textoTerciario,
    fontSize: Fonte.corpo,
    fontWeight: '700',
  },
  textoAbaAtiva: { color: Cores.texto },
  sobre: { paddingBottom: Espacamento.lg },
  ficha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Cores.divisoria,
    paddingTop: Espacamento.lg,
    marginTop: Espacamento.lg,
  },
  fichaRotulo: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  fichaValor: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '600' },
  voltar: {
    position: 'absolute',
    left: Espacamento.lg,
    width: 36,
    height: 36,
    borderRadius: Raio.pilula,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
