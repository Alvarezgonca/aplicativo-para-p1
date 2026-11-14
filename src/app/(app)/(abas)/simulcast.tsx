import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BarraSuperior } from '@/componentes/barra-superior';
import { Carregando, MensagemErro, Vazio } from '@/componentes/estado-tela';
import { Selo } from '@/componentes/selo';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { usePreferencias } from '@/contextos/preferencias';
import { useAlturaBarraAbas } from '@/hooks/use-altura-barra-abas';
import { useFetch } from '@/hooks/use-fetch';
import { catalogo } from '@/services/anilist';
import { comCache, HORA } from '@/services/cache';
import type { Lancamento } from '@/services/tipos';

const NOMES_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIA_MS = 24 * HORA;

interface Dia {
  /** Meia-noite do dia, no fuso do aparelho, em milissegundos. */
  inicio: number;
  rotulo: string;
  data: string;
}

/** Os sete dias a partir de hoje, cada um comecando a meia-noite local. */
function proximosDias(): Dia[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, indice) => {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() + indice);
    return {
      inicio: dia.getTime(),
      rotulo: indice === 0 ? 'Hoje' : indice === 1 ? 'Amanhã' : NOMES_DIAS[dia.getDay()],
      data: `${String(dia.getDate()).padStart(2, '0')}/${String(dia.getMonth() + 1).padStart(2, '0')}`,
    };
  });
}

function formatarHora(horario: number): string {
  const data = new Date(horario);
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
}

function CartaoLancamento({ lancamento, agora }: { lancamento: Lancamento; agora: number }) {
  const router = useRouter();
  const { anime } = lancamento;
  const { tituloDe } = usePreferencias();
  const aguardando = lancamento.horario > agora;

  return (
    <Pressable
      style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
      onPress={() => router.push({ pathname: '/anime/[id]', params: { id: anime.id } })}>
      <View style={[styles.moldura, anime.cor ? { backgroundColor: anime.cor } : null]}>
        <Image
          source={anime.banner ?? anime.capa}
          style={styles.miniatura}
          contentFit="cover"
          transition={200}
        />

        {/* Episodios que ainda nao foram ao ar ficam escurecidos, com relogio. */}
        {aguardando ? (
          <View style={styles.veu}>
            <Ionicons name="time-outline" size={20} color={Cores.texto} />
          </View>
        ) : null}

        <View style={styles.horario}>
          <Text style={styles.textoHorario}>{formatarHora(lancamento.horario)}</Text>
        </View>
      </View>

      <View style={styles.informacoes}>
        <Text style={styles.tituloAnime} numberOfLines={2}>
          {tituloDe(anime)}
        </Text>
        <Text style={styles.episodio}>
          Episódio {lancamento.episodio}
          {anime.totalEpisodios ? ` de ${anime.totalEpisodios}` : ''}
        </Text>
        <View style={styles.selos}>
          {aguardando ? (
            <Selo texto="Em breve" variante="contorno" />
          ) : (
            <Selo texto="Disponível" variante="marca" />
          )}
          {anime.formato ? <Selo texto={anime.formato} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Grade de lancamentos da semana.
 *
 * Cada dia e uma consulta a API com o intervalo entre a meia-noite e a
 * meia-noite seguinte no fuso do aparelho, de modo que os horarios exibidos
 * ja estao convertidos para o horario de Brasilia (ou o do usuario). A
 * resposta de cada dia fica uma hora no cache.
 */
export default function TelaSimulcast() {
  const alturaAbas = useAlturaBarraAbas();
  // O relogio e lido uma vez, ao abrir a tela (inicializacao preguicosa do
  // useState), e nao a cada renderizacao, para o resultado ser estavel.
  const [dias] = useState(proximosDias);
  const [agora, setAgora] = useState(() => Date.now());
  const [selecionado, setSelecionado] = useState(dias[0].inicio);

  const buscarDia = useCallback(
    (forcar: boolean) =>
      comCache(
        `grade:${new Date(selecionado).toISOString().slice(0, 10)}`,
        () => catalogo.lancamentos(selecionado, selecionado + DIA_MS),
        HORA,
        forcar,
      ),
    [selecionado],
  );
  const { dados, loading, erro, atualizando, recarregar, atualizar } = useFetch(buscarDia);

  let conteudo;
  if (loading) {
    conteudo = <Carregando />;
  } else if (erro || !dados) {
    conteudo = (
      <MensagemErro mensagem={erro ?? 'Grade indisponível.'} aoTentarDeNovo={recarregar} />
    );
  } else {
    conteudo = (
      <FlatList
        data={dados}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <CartaoLancamento lancamento={item} agora={agora} />}
        ListEmptyComponent={
          <Vazio
            icone="calendar-clear-outline"
            titulo="Nenhum episódio neste dia"
            texto="Escolha outro dia da semana."
          />
        }
        contentContainerStyle={[
          { paddingBottom: alturaAbas + Espacamento.xl },
          dados.length === 0 && styles.listaVazia,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => {
              setAgora(Date.now());
              atualizar();
            }}
            tintColor={Cores.marca}
            colors={[Cores.marca]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View style={styles.container}>
      <BarraSuperior />

      <View style={styles.cabecalho}>
        <Text style={styles.titulo}>Simulcast</Text>
        <Text style={styles.subtitulo}>
          Episódios novos no mesmo dia da exibição no Japão, no seu horário.
        </Text>
      </View>

      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dias}>
          {dias.map((dia) => {
            const ativo = dia.inicio === selecionado;
            return (
              <Pressable
                key={dia.inicio}
                style={[styles.dia, ativo && styles.diaAtivo]}
                onPress={() => setSelecionado(dia.inicio)}>
                <Text style={[styles.rotuloDia, ativo && styles.textoAtivo]}>{dia.rotulo}</Text>
                <Text style={[styles.dataDia, ativo && styles.textoAtivo]}>{dia.data}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {conteudo}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },

  cabecalho: { paddingHorizontal: Espacamento.lg, paddingBottom: Espacamento.md },
  titulo: { color: Cores.texto, fontSize: Fonte.destaque, fontWeight: '800' },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    lineHeight: 19,
    marginTop: Espacamento.xs,
  },

  dias: {
    flexDirection: 'row',
    gap: Espacamento.sm,
    paddingHorizontal: Espacamento.lg,
    paddingBottom: Espacamento.md,
  },
  dia: {
    minWidth: 58,
    alignItems: 'center',
    paddingVertical: Espacamento.sm,
    paddingHorizontal: Espacamento.md,
    borderRadius: Raio.md,
    backgroundColor: Cores.superficie,
    borderWidth: 1,
    borderColor: Cores.divisoria,
  },
  diaAtivo: { backgroundColor: Cores.marca, borderColor: Cores.marca },
  rotuloDia: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  dataDia: { color: Cores.textoTerciario, fontSize: Fonte.minuscula, marginTop: 2 },
  textoAtivo: { color: Cores.texto },

  listaVazia: { flexGrow: 1 },

  cartao: {
    flexDirection: 'row',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  pressionado: { opacity: 0.7 },
  moldura: {
    width: 124,
    height: 70,
    borderRadius: Raio.md,
    overflow: 'hidden',
    backgroundColor: Cores.superficie,
  },
  miniatura: { width: '100%', height: '100%' },
  veu: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horario: {
    position: 'absolute',
    left: Espacamento.xs,
    bottom: Espacamento.xs,
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Raio.sm,
  },
  textoHorario: {
    color: Cores.texto,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },

  informacoes: { flex: 1, justifyContent: 'center', gap: Espacamento.xs },
  tituloAnime: {
    color: Cores.texto,
    fontSize: Fonte.pequena,
    fontWeight: '700',
    lineHeight: 18,
  },
  episodio: { color: Cores.textoSecundario, fontSize: Fonte.minuscula },
  selos: { flexDirection: 'row', gap: Espacamento.xs, marginTop: 2 },
});
