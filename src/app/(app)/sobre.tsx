import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CabecalhoTela } from '@/componentes/cabecalho-tela';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { URL_API_APP } from '@/services/autenticacao';

type NomeIcone = keyof typeof Ionicons.glyphMap;

const APIS: { nome: string; tipo: string; uso: string; endereco: string }[] = [
  {
    nome: 'AniList',
    tipo: 'GraphQL',
    uso: 'Catálogo, busca, episódios, personagens, ranking e grade de lançamentos.',
    endereco: 'https://docs.anilist.co',
  },
  {
    nome: 'API do aplicativo',
    tipo: 'REST + JWT',
    uso: 'Cadastro, login, minha lista e histórico de cada conta, num banco PostgreSQL. Toque para abrir a documentação.',
    // A documentacao (Swagger) fica na raiz do servidor, fora do /v1.
    endereco: `${URL_API_APP.replace(/\/v1\/?$/, '')}/docs`,
  },
];

const TECNOLOGIAS: { icone: NomeIcone; nome: string; detalhe: string }[] = [
  {
    icone: 'logo-react',
    nome: 'React Native + Expo',
    detalhe: 'Um código para Android, iOS e web',
  },
  {
    icone: 'git-branch-outline',
    nome: 'Expo Router',
    detalhe: 'Pilhas, abas, grupos e rotas dinâmicas',
  },
  {
    icone: 'server-outline',
    nome: 'AsyncStorage',
    detalhe: 'Cópia local da lista e do histórico, fila offline e cache',
  },
  { icone: 'lock-closed-outline', nome: 'SecureStore', detalhe: 'Tokens guardados criptografados' },
  {
    icone: 'wifi-outline',
    nome: 'NetInfo',
    detalhe: 'Envia a fila e recarrega ao voltar a conexão',
  },
  {
    icone: 'cloud-outline',
    nome: 'Node.js + Express',
    detalhe: 'API própria, com validação e limite de tentativas',
  },
  { icone: 'albums-outline', nome: 'PostgreSQL', detalhe: 'Contas, listas e históricos' },
];

const AUTORES = ['Daniel Alvarez Gonçalves', 'Clara Moledo'];

/** Informacoes do aplicativo. A versao vem do app.json, lida pelo expo-constants. */
export default function TelaSobre() {
  const versao = Constants.expoConfig?.version ?? '1.0.0';
  const sdk = Constants.expoConfig?.sdkVersion;
  const plataforma =
    { ios: 'iOS', android: 'Android', web: 'Web' }[Platform.OS as string] ?? Platform.OS;

  return (
    <View style={styles.container}>
      <CabecalhoTela titulo="Sobre o aplicativo" />

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.marca}>
          <Text style={styles.logo}>crunchyroll</Text>
          <Text style={styles.versao}>
            Versão {versao}
            {sdk ? ` · Expo SDK ${sdk.split('.')[0]}` : ''} · {plataforma}
          </Text>
        </View>

        <Text style={styles.texto}>
          Projeto acadêmico da disciplina de Aplicativos Híbridos (Univassouras). Recria a
          experiência de um aplicativo de streaming de animes: o catálogo vem do AniList e as contas
          ficam numa API própria. Não tem vínculo com a Crunchyroll e não reproduz vídeos.
        </Text>

        <Text style={styles.tituloGrupo}>APIs consumidas</Text>
        {APIS.map((api) => (
          <Pressable
            key={api.nome}
            style={({ pressed }) => [styles.cartao, pressed && styles.pressionado]}
            onPress={() => WebBrowser.openBrowserAsync(api.endereco)}>
            <View style={styles.linhaCartao}>
              <Text style={styles.nomeApi}>{api.nome}</Text>
              <View style={styles.selo}>
                <Text style={styles.textoSelo}>{api.tipo}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={Cores.textoTerciario} />
            </View>
            <Text style={styles.uso}>{api.uso}</Text>
          </Pressable>
        ))}

        <Text style={styles.tituloGrupo}>Feito com</Text>
        <View style={styles.grupo}>
          {TECNOLOGIAS.map((tecnologia, indice) => (
            <View key={tecnologia.nome}>
              {indice > 0 ? <View style={styles.divisoria} /> : null}
              <View style={styles.linha}>
                <Ionicons name={tecnologia.icone} size={20} color={Cores.marca} />
                <View style={styles.textos}>
                  <Text style={styles.nome}>{tecnologia.nome}</Text>
                  <Text style={styles.detalhe}>{tecnologia.detalhe}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.tituloGrupo}>Autores</Text>
        <View style={styles.grupo}>
          {AUTORES.map((autor, indice) => (
            <View key={autor}>
              {indice > 0 ? <View style={styles.divisoria} /> : null}
              <View style={styles.linha}>
                <View style={styles.avatar}>
                  <Text style={styles.iniciais}>
                    {autor
                      .split(' ')
                      .filter((parte) => parte.length > 2)
                      .map((parte) => parte[0])
                      .slice(0, 2)
                      .join('')}
                  </Text>
                </View>
                <Text style={styles.nome}>{autor}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { padding: Espacamento.lg, paddingBottom: Espacamento.xxl },
  marca: { alignItems: 'center', paddingVertical: Espacamento.xl, gap: Espacamento.xs },
  logo: { color: Cores.marca, fontSize: Fonte.heroi, fontWeight: '800', letterSpacing: -0.5 },
  versao: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  texto: {
    color: Cores.textoSecundario,
    fontSize: Fonte.pequena,
    lineHeight: 20,
    textAlign: 'center',
  },
  tituloGrupo: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: Espacamento.xl,
    marginBottom: Espacamento.sm,
  },
  cartao: {
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg,
    padding: Espacamento.lg,
    gap: Espacamento.xs,
    marginBottom: Espacamento.sm,
  },
  pressionado: { opacity: 0.7 },
  linhaCartao: { flexDirection: 'row', alignItems: 'center', gap: Espacamento.sm },
  nomeApi: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  selo: {
    backgroundColor: 'rgba(244,117,33,0.15)',
    borderRadius: Raio.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 'auto',
  },
  textoSelo: { color: Cores.marca, fontSize: Fonte.minuscula, fontWeight: '700' },
  uso: { color: Cores.textoSecundario, fontSize: Fonte.pequena, lineHeight: 19 },
  grupo: { backgroundColor: Cores.superficie, borderRadius: Raio.lg, overflow: 'hidden' },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    paddingHorizontal: Espacamento.lg,
    paddingVertical: Espacamento.md,
  },
  textos: { flex: 1, gap: 2 },
  nome: { color: Cores.texto, fontSize: Fonte.pequena, fontWeight: '600' },
  detalhe: { color: Cores.textoTerciario, fontSize: Fonte.minuscula },
  divisoria: { height: 1, backgroundColor: Cores.divisoria, marginLeft: Espacamento.lg },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.superficieAlta,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iniciais: { color: Cores.marca, fontSize: Fonte.pequena, fontWeight: '800' },
});
