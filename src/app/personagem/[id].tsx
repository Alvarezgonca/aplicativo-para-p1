import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Carrossel } from '@/componentes/carrossel';
import { Carregando, MensagemErro } from '@/componentes/estado-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, HORA } from '@/services/cache';

/**
 * Ficha de um personagem: foto, dados basicos, descricao e os animes em que
 * aparece. A descricao vem da API com marcacao e trechos de spoiler, que a
 * camada de servico ja removeu.
 */
export default function TelaPersonagem() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personagemId = Number(id);
  const recuo = useSafeAreaInsets();
  const [descricaoAberta, setDescricaoAberta] = useState(false);

  const buscarPersonagem = useCallback(
    (forcar: boolean) =>
      comCache(
        `personagem:${personagemId}`,
        () => catalogo.personagem(personagemId),
        6 * HORA,
        forcar,
      ),
    [personagemId],
  );
  const { dados: personagem, loading, erro, recarregar } = useFetch(buscarPersonagem);

  if (loading) {
    return (
      <View style={styles.container}>
        <CabecalhoTela titulo="Personagem" />
        <Carregando />
      </View>
    );
  }

  if (erro || !personagem) {
    return (
      <View style={styles.container}>
        <CabecalhoTela titulo="Personagem" />
        <MensagemErro mensagem={erro ?? 'Personagem indisponível.'} aoTentarDeNovo={recarregar} />
      </View>
    );
  }

  const dados = [
    { icone: 'person-outline' as const, rotulo: 'Gênero', valor: personagem.genero },
    { icone: 'hourglass-outline' as const, rotulo: 'Idade', valor: personagem.idade },
    { icone: 'gift-outline' as const, rotulo: 'Aniversário', valor: personagem.aniversario },
  ].filter((item) => item.valor);

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo={personagem.nome} subtitulo={personagem.nomeNativo ?? undefined} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: recuo.bottom + Espacamento.xxl }}>
        <View style={styles.topo}>
          <Image
            source={personagem.imagem}
            style={styles.foto}
            contentFit="cover"
            transition={300}
          />

          <View style={styles.resumo}>
            <Text style={styles.nome}>{personagem.nome}</Text>
            {personagem.nomeNativo ? (
              <Text style={styles.nomeNativo}>{personagem.nomeNativo}</Text>
            ) : null}

            <View style={styles.favoritos}>
              <Ionicons name="heart" size={14} color={Cores.erro} />
              <Text style={styles.textoFavoritos}>
                {personagem.favoritos.toLocaleString('pt-BR')} favoritos
              </Text>
            </View>

            {dados.map((item) => (
              <View key={item.rotulo} style={styles.dado}>
                <Ionicons name={item.icone} size={14} color={Cores.textoTerciario} />
                <Text style={styles.rotuloDado}>{item.rotulo}</Text>
                <Text style={styles.valorDado} numberOfLines={1}>
                  {item.valor}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {personagem.descricao ? (
          <Pressable
            style={styles.blocoDescricao}
            onPress={() => setDescricaoAberta((atual) => !atual)}>
            <Text style={styles.tituloBloco}>Sobre</Text>
            <Text style={styles.descricao} numberOfLines={descricaoAberta ? undefined : 6}>
              {personagem.descricao}
            </Text>
            <Text style={styles.verMais}>{descricaoAberta ? 'Ver menos' : 'Ver mais'}</Text>
          </Pressable>
        ) : null}

        <Carrossel titulo="Aparece em" animes={personagem.aparicoes} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  topo: {
    flexDirection: 'row',
    gap: Espacamento.lg,
    padding: Espacamento.lg,
  },
  foto: {
    width: 130,
    height: 190,
    borderRadius: Raio.lg,
    backgroundColor: Cores.superficie,
  },
  resumo: { flex: 1, gap: Espacamento.sm },
  nome: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  nomeNativo: { color: Cores.textoTerciario, fontSize: Fonte.pequena, marginTop: -Espacamento.xs },
  favoritos: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs },
  textoFavoritos: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  dado: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.xs },
  rotuloDado: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  valorDado: { flex: 1, color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '600' },
  blocoDescricao: { paddingHorizontal: Espacamento.lg },
  tituloBloco: {
    color: Cores.texto,
    fontSize: Fonte.titulo,
    fontWeight: '700',
    marginBottom: Espacamento.sm,
  },
  descricao: { color: Cores.textoSecundario, fontSize: Fonte.corpo, lineHeight: 22 },
  verMais: {
    color: Cores.marca,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    marginTop: Espacamento.sm,
  },
});
