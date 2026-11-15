import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoFormulario } from '@/componentes/campo-formulario';
import { Cores, Espacamento, Fonte, Raio } from '@/constants/tema';
import { useSessao } from '@/contextos/sessao';
import { mensagemDeErro } from '@/services/api';
import { CONTA_DEMONSTRACAO } from '@/services/autenticacao';

/** Formato basico de e-mail: algo@algo.algo, sem espacos. */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Confere os campos antes de gastar uma requisicao. Devolve o erro ou null. */
function validar(email: string, senha: string): string | null {
  if (!FORMATO_EMAIL.test(email.trim())) {
    return 'Informe um e-mail válido.';
  }
  if (!senha) {
    return 'Informe a senha.';
  }
  return null;
}

/**
 * Tela de login.
 *
 * O KeyboardAvoidingView empurra o formulario para cima quando o teclado
 * abre, para o botao Entrar nao ficar escondido. Enquanto a requisicao esta
 * em andamento os campos e o botao ficam travados, evitando dois envios.
 */
export default function TelaEntrar() {
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const { entrar, ultimoEmail } = useSessao();

  const [email, setEmail] = useState(ultimoEmail);
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const campoSenha = useRef<ComponentRef<typeof TextInput>>(null);

  async function enviar(endereco = email, segredo = senha) {
    const problema = validar(endereco, segredo);
    if (problema) {
      setErro(problema);
      return;
    }

    setErro(null);
    setEnviando(true);
    try {
      await entrar(endereco, segredo);
      // replace: depois de logado, o voltar nao deve trazer o login de volta.
      router.replace('/');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
  }

  function usarDemonstracao() {
    setEmail(CONTA_DEMONSTRACAO.email);
    setSenha(CONTA_DEMONSTRACAO.senha);
    enviar(CONTA_DEMONSTRACAO.email, CONTA_DEMONSTRACAO.senha);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient
        colors={['#3A1A06', Cores.fundo]}
        locations={[0, 0.45]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: recuo.top + Espacamento.xxl, paddingBottom: recuo.bottom + Espacamento.xl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>crunchyroll</Text>
        <Text style={styles.titulo}>Entrar</Text>
        <Text style={styles.subtitulo}>
          Acesse sua conta para ver a sua lista e o seu progresso.
        </Text>

        <View style={styles.formulario}>
          <CampoFormulario
            rotulo="E-mail"
            icone="mail-outline"
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            editable={!enviando}
            onSubmitEditing={() => campoSenha.current?.focus()}
          />
          <CampoFormulario
            ref={campoSenha}
            rotulo="Senha"
            icone="lock-closed-outline"
            senha
            value={senha}
            onChangeText={setSenha}
            placeholder="sua senha"
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            editable={!enviando}
            onSubmitEditing={() => enviar()}
          />

          {erro ? (
            <View style={styles.erro}>
              <Ionicons name="alert-circle" size={18} color={Cores.erro} />
              <Text style={styles.textoErro}>{erro}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.botao, (pressed || enviando) && styles.pressionado]}
            onPress={() => enviar()}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Entrar na conta">
            {enviando ? (
              <ActivityIndicator color={Cores.texto} />
            ) : (
              <Text style={styles.textoBotao}>Entrar</Text>
            )}
          </Pressable>

          <View style={styles.separador}>
            <View style={styles.linha} />
            <Text style={styles.ou}>ou</Text>
            <View style={styles.linha} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.botaoSecundario, pressed && styles.pressionado]}
            onPress={usarDemonstracao}
            disabled={enviando}>
            <Ionicons name="flash-outline" size={18} color={Cores.marca} />
            <Text style={styles.textoSecundario}>Usar conta de demonstração</Text>
          </Pressable>
          <Text style={styles.dica}>
            Conta de teste: {CONTA_DEMONSTRACAO.email} / {CONTA_DEMONSTRACAO.senha}
          </Text>

          <Pressable
            style={styles.trocar}
            onPress={() => router.push('/cadastro')}
            disabled={enviando}
            accessibilityRole="link">
            <Text style={styles.textoTrocar}>
              Ainda não tem conta? <Text style={styles.link}>Criar conta</Text>
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { flexGrow: 1, paddingHorizontal: Espacamento.xl },
  logo: { color: Cores.marca, fontSize: Fonte.destaque, fontWeight: '800', letterSpacing: -0.5 },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    marginTop: Espacamento.xxl,
  },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    lineHeight: 22,
    marginTop: Espacamento.sm,
  },
  formulario: { marginTop: Espacamento.xxl, gap: Espacamento.sm },
  erro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.sm,
    backgroundColor: 'rgba(229,72,77,0.12)',
    borderRadius: Raio.md,
    padding: Espacamento.md,
    marginTop: Espacamento.sm,
  },
  textoErro: { flex: 1, color: Cores.erro, fontSize: Fonte.pequena, fontWeight: '600' },
  botao: {
    backgroundColor: Cores.marca,
    borderRadius: Raio.sm,
    paddingVertical: Espacamento.lg,
    alignItems: 'center',
    marginTop: Espacamento.lg,
  },
  pressionado: { opacity: 0.7 },
  textoBotao: { color: Cores.texto, fontSize: Fonte.corpo, fontWeight: '700' },
  separador: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacamento.md,
    marginVertical: Espacamento.md,
  },
  linha: { flex: 1, height: 1, backgroundColor: Cores.divisoria },
  ou: { color: Cores.textoTerciario, fontSize: Fonte.pequena },
  botaoSecundario: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacamento.sm,
    borderWidth: 1,
    borderColor: Cores.marca,
    borderRadius: Raio.sm,
    paddingVertical: Espacamento.lg,
  },
  textoSecundario: { color: Cores.marca, fontSize: Fonte.corpo, fontWeight: '700' },
  dica: {
    color: Cores.textoTerciario,
    fontSize: Fonte.minuscula,
    textAlign: 'center',
    marginTop: Espacamento.sm,
  },
  trocar: { alignItems: 'center', paddingVertical: Espacamento.lg },
  textoTrocar: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  link: { color: Cores.marca, fontWeight: '700' },
});
