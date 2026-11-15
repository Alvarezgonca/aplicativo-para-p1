import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useHistorico } from '@/contextos/historico';
import { usePreferencias, type IdiomaTitulo } from '@/contextos/preferencias';
import { useFetch } from '@/hooks/use-fetch';
import { limparCache, PREFIXO_CACHE } from '@/services/cache';
import { storage, type ItemGuardado } from '@/services/storage';

const IDIOMAS: { valor: IdiomaTitulo; rotulo: string; exemplo: string }[] = [
  { valor: 'ingles', rotulo: 'Inglês', exemplo: 'Attack on Titan' },
  { valor: 'romaji', rotulo: 'Romaji', exemplo: 'Shingeki no Kyojin' },
  { valor: 'nativo', rotulo: 'Japonês', exemplo: '進撃の巨人' },
];

/** Nome legivel de cada chave gravada; o id do usuario fica depois dos dois-pontos. */
const NOMES: Record<string, string> = {
  'minha-lista': 'Minha lista',
  historico: 'Histórico',
  sessao: 'Sessão (usuário)',
  fila: 'Fila de sincronização',
  preferencias: 'Preferências',
  'buscas-recentes': 'Buscas recentes',
  'boas-vindas-vista': 'Apresentação vista',
  'ultimo-email': 'Último e-mail',
};

function formatarBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
}

/**
 * Junta as respostas em cache em uma linha so; as demais chaves aparecem uma
 * a uma, com o nome legivel e a chave real embaixo.
 */
function resumirArmazenamento(itens: ItemGuardado[]) {
  const cache = itens.filter((item) => item.chave.startsWith(PREFIXO_CACHE));
  const outros = itens.filter((item) => !item.chave.startsWith(PREFIXO_CACHE));
  const linhas = outros.map((item) => ({
    nome: NOMES[item.chave.split(':')[0]] ?? item.chave,
    chave: item.chave,
    bytes: item.bytes,
  }));
  if (cache.length > 0) {
    linhas.push({
      nome: `Cache de consultas (${cache.length})`,
      chave: `${PREFIXO_CACHE}*`,
      bytes: cache.reduce((total, item) => total + item.bytes, 0),
    });
  }
  const total = itens.reduce((soma, item) => soma + item.bytes, 0);
  return { linhas, total };
}

function LinhaInterruptor(props: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descricao: string;
  valor: boolean;
  aoMudar: (valor: boolean) => void;
}) {
  return (
    <View style={styles.linha}>
      <Ionicons name={props.icone} size={20} color={Cores.textoSecundario} />
      <View style={styles.textos}>
        <Text style={styles.tituloLinha}>{props.titulo}</Text>
        <Text style={styles.descricao}>{props.descricao}</Text>
      </View>
      <Switch
        value={props.valor}
        onValueChange={props.aoMudar}
        trackColor={{ false: Cores.superficieAlta, true: Cores.marcaEscura }}
        thumbColor={props.valor ? Cores.marca : Cores.textoTerciario}
        accessibilityLabel={props.titulo}
      />
    </View>
  );
}

/**
 * Configuracoes do aparelho e da conta.
 *
 * As chaves de cima sao as preferencias (gravadas pelo usePersistedState).
 * A secao Armazenamento le o proprio AsyncStorage e mostra o que o
 * aplicativo guarda e quanto ocupa, com opcoes para liberar espaco.
 */
export default function TelaConfiguracoes() {
  const router = useRouter();
  const { preferencias, alterar } = usePreferencias();
  const { limpar: limparHistorico, registros } = useHistorico();
  const [aviso, setAviso] = useState<string | null>(null);

  const buscarArmazenamento = useCallback(() => storage.listar(), []);
  const { dados: guardados, loading, recarregar } = useFetch(buscarArmazenamento);
  const resumo = guardados ? resumirArmazenamento(guardados) : null;

  async function apagarCache() {
    const removidos = await limparCache();
    setAviso(
      removidos === 1
        ? '1 consulta apagada do cache.'
        : `${removidos} consultas apagadas do cache.`,
    );
    recarregar();
  }

  function apagarHistorico() {
    limparHistorico();
    setAviso('Histórico apagado.');
    // A gravacao no disco termina logo depois; a lista e relida em seguida.
    setTimeout(recarregar, 300);
  }

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Configurações" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.tituloGrupo}>Reprodução</Text>
        <View style={styles.grupo}>
          <LinhaInterruptor
            icone="play-skip-forward-outline"
            titulo="Reprodução automática"
            descricao="Abre o próximo episódio quando o atual termina."
            valor={preferencias.reproducaoAutomatica}
            aoMudar={(valor) => alterar({ reproducaoAutomatica: valor })}
          />
        </View>

        <Text style={styles.tituloGrupo}>Exibição</Text>
        <View style={styles.grupo}>
          <View style={styles.linhaIdioma}>
            <View style={styles.cabecalhoIdioma}>
              <Ionicons name="language-outline" size={20} color={Cores.textoSecundario} />
              <Text style={styles.tituloLinha}>Idioma dos títulos</Text>
            </View>
            <View style={styles.opcoes}>
              {IDIOMAS.map((idioma) => {
                const ativo = preferencias.idiomaTitulo === idioma.valor;
                return (
                  <Pressable
                    key={idioma.valor}
                    style={[styles.opcao, ativo && styles.opcaoAtiva]}
                    onPress={() => alterar({ idiomaTitulo: idioma.valor })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}>
                    <Text style={[styles.rotuloOpcao, ativo && styles.rotuloAtivo]}>
                      {idioma.rotulo}
                    </Text>
                    <Text style={styles.exemplo} numberOfLines={1}>
                      {idioma.exemplo}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <View style={styles.divisoria} />
          <LinhaInterruptor
            icone="cellular-outline"
            titulo="Economia de dados"
            descricao="Carrega capas menores nas listas e no catálogo."
            valor={preferencias.economiaDados}
            aoMudar={(valor) => alterar({ economiaDados: valor })}
          />
        </View>

        <Text style={styles.tituloGrupo}>Armazenamento no aparelho</Text>
        <View style={styles.grupo}>
          {loading || !resumo ? (
            <View style={styles.carregando}>
              <ActivityIndicator color={Cores.marca} />
            </View>
          ) : (
            <>
              {resumo.linhas.map((linha) => (
                <View key={linha.chave} style={styles.linhaArmazenamento}>
                  <View style={styles.textos}>
                    <Text style={styles.tituloLinha}>{linha.nome}</Text>
                    <Text style={styles.chave}>{linha.chave}</Text>
                  </View>
                  <Text style={styles.tamanho}>{formatarBytes(linha.bytes)}</Text>
                </View>
              ))}
              <View style={styles.linhaArmazenamento}>
                <View style={styles.textos}>
                  <Text style={styles.tituloLinha}>Tokens de acesso e renovação</Text>
                  <Text style={styles.chave}>
                    {Platform.OS === 'web'
                      ? 'localStorage (navegador)'
                      : 'SecureStore (criptografado)'}
                  </Text>
                </View>
                <Ionicons name="lock-closed" size={16} color={Cores.sucesso} />
              </View>
              <View style={styles.total}>
                <Text style={styles.textoTotal}>Total no AsyncStorage</Text>
                <Text style={styles.textoTotal}>{formatarBytes(resumo.total)}</Text>
              </View>
            </>
          )}
        </View>

        {aviso ? (
          <View style={styles.aviso}>
            <Ionicons name="checkmark-circle" size={18} color={Cores.sucesso} />
            <Text style={styles.textoAviso}>{aviso}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [styles.botao, pressed && styles.pressionado]}
          onPress={apagarCache}>
          <Ionicons name="trash-outline" size={18} color={Cores.texto} />
          <Text style={styles.textoBotao}>Limpar cache de consultas</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.botao,
            styles.botaoPerigo,
            registros.length === 0 && styles.desativado,
            pressed && styles.pressionado,
          ]}
          onPress={apagarHistorico}
          disabled={registros.length === 0}>
          <Ionicons name="time-outline" size={18} color={Cores.erro} />
          <Text style={[styles.textoBotao, styles.textoPerigo]}>Limpar histórico</Text>
        </Pressable>

        <Text style={styles.tituloGrupo}>Conta</Text>
        <View style={styles.grupo}>
          <Pressable
            style={({ pressed }) => [styles.linha, pressed && styles.linhaPressionada]}
            onPress={() => router.push('/excluir-conta')}
            accessibilityRole="button">
            <Ionicons name="person-remove-outline" size={20} color={Cores.erro} />
            <View style={styles.textos}>
              <Text style={[styles.tituloLinha, styles.textoPerigo]}>Excluir minha conta</Text>
              <Text style={styles.descricao}>Apaga a conta e os dados dela do servidor.</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Cores.textoTerciario} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },
  tituloGrupo: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Espacamento.lg,
    marginBottom: Espacamento.sm,
  },
  grupo: { backgroundColor: Cores.superficie, borderRadius: Raio.lg, overflow: 'hidden' },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  textos: { flex: 1, gap: 2 },
  tituloLinha: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '600' },
  descricao: { color: Cores.textoTerciario, fontSize: Fonte.minuscula, lineHeight: 16 },
  divisoria: { height: 1, backgroundColor: Cores.divisoria, marginLeft: Espacamento.lg },
  linhaIdioma: { padding: Espacamento.lg, gap: Espacamento.md },
  cabecalhoIdioma: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.md },
  opcoes: { flexDirection: 'row', gap: Espacamento.sm },
  opcao: {
    flex: 1,
    paddingVertical: Espacamento.sm,
    paddingHorizontal: Espacamento.sm,
    borderRadius: Raio.md,
    borderWidth: 1,
    borderColor: Cores.divisoria,
    alignItems: 'center',
    gap: 2,
  },
  opcaoAtiva: { borderColor: Cores.marca, backgroundColor: 'rgba(244,117,33,0.12)' },
  rotuloOpcao: { color: Cores.textoSecundario, fontSize: Fonte.pequena, fontWeight: '700' },
  rotuloAtivo: { color: Cores.marca },
  exemplo: { color: Cores.textoTerciario, fontSize: 10 },
  carregando: { paddingVertical: Espacamento.xl },
  linhaArmazenamento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Cores.divisoria,
  },
  chave: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
  },
  tamanho: { color: Cores.textoSecundario, fontSize: Fonte.pequena, fontVariant: ['tabular-nums'] },
  total: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  textoTotal: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '700' },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    marginTop: Espacamento.lg,
  },
  textoAviso: { color: Cores.sucesso, fontSize: Fonte.pequena, fontWeight: '600' },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    backgroundColor: Cores.superficieAlta,
    borderRadius: Raio.md,
    paddingVertical: Espacamento.md + 2,
    marginTop: Espacamento.lg,
  },
  botaoPerigo: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Cores.erro },
  desativado: { opacity: 0.4 },
  pressionado: { opacity: 0.7 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  textoPerigo: { color: Cores.erro },
  linhaPressionada: { backgroundColor: Cores.superficieAlta },
});
