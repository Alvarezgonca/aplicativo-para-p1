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

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Dados {
  nome: string;
  email: string;
  senha: string;
  confirmacao: string;
}

/**
 * Confere os campos antes de enviar. As regras da senha sao as mesmas que a
 * API aplica; conferir aqui so poupa uma ida ao servidor, e a API continua
 * validando tudo de novo, porque o aplicativo pode ser burlado.
 */
function validar({ nome, email, senha, confirmacao }: Dados): string | null {
  if (nome.trim().length < 2) return 'Informe o seu nome.';
  if (!FORMATO_EMAIL.test(email.trim())) return 'Informe um e-mail válido.';
  if (senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
  if (!/\p{L}/u.test(senha) || !/\d/.test(senha)) {
    return 'A senha precisa ter letras e números.';
  }
  if (senha !== confirmacao) return 'As senhas não são iguais.';
  return null;
}

/**
 * Cadastro de conta.
 *
 * Envia nome, e-mail e senha para POST /auth/cadastro. A API guarda so o
 * hash da senha e ja devolve a sessao aberta, entao quem se cadastra entra
 * direto no aplicativo, sem precisar fazer login em seguida.
 */
export default function TelaCadastro() {
  const router = useRouter();
  const recuo = useSafeAreaInsets();
  const { cadastrar } = useSessao();

  const [dados, setDados] = useState<Dados>({ nome: '', email: '', senha: '', confirmacao: '' });
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const campoEmail = useRef<ComponentRef<typeof TextInput>>(null);
  const campoSenha = useRef<ComponentRef<typeof TextInput>>(null);
  const campoConfirmacao = useRef<ComponentRef<typeof TextInput>>(null);

  function alterar(campo: keyof Dados) {
    return (valor: string) => setDados((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviar() {
    const problema = validar(dados);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setEnviando(true);
    try {
      await cadastrar(dados.nome, dados.email, dados.senha);
      router.replace('/');
    } catch (falha) {
      setErro(mensagemDeErro(falha));
      setEnviando(false);
    }
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
          { paddingTop: recuo.top + Espacamento.lg, paddingBottom: recuo.bottom + Espacamento.xl },
        ]}
        keyboardShouldPersistTaps="handled">
        <Pressable
          style={styles.voltar}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/entrar'))}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o login">
          <Ionicons name="chevron-back" size={24} color={Cores.texto} />
        </Pressable>

        <Text style={styles.titulo}>Criar conta</Text>
        <Text style={styles.subtitulo}>
          Sua lista e o seu progresso ficam salvos na conta e voltam em qualquer celular.
        </Text>

        <View style={styles.formulario}>
          <CampoFormulario
            rotulo="Nome"
            icone="person-outline"
            value={dados.nome}
            onChangeText={alterar('nome')}
            placeholder="como você quer ser chamado"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            editable={!enviando}
            onSubmitEditing={() => campoEmail.current?.focus()}
          />
          <CampoFormulario
            ref={campoEmail}
            rotulo="E-mail"
            icone="mail-outline"
            value={dados.email}
            onChangeText={alterar('email')}
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
            value={dados.senha}
            onChangeText={alterar('senha')}
            placeholder="crie uma senha"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            editable={!enviando}
            onSubmitEditing={() => campoConfirmacao.current?.focus()}
            ajuda="Mínimo de 8 caracteres, com letras e números."
          />
          <CampoFormulario
            ref={campoConfirmacao}
            rotulo="Confirmar senha"
            icone="lock-closed-outline"
            senha
            value={dados.confirmacao}
            onChangeText={alterar('confirmacao')}
            placeholder="repita a senha"
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="go"
            editable={!enviando}
            onSubmitEditing={enviar}
          />

          {erro ? (
            <View style={styles.erro}>
              <Ionicons name="alert-circle" size={18} color={Cores.erro} />
              <Text style={styles.textoErro}>{erro}</Text>
            </View>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.botao, (pressed || enviando) && styles.pressionado]}
            onPress={enviar}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Criar conta">
            {enviando ? (
              <ActivityIndicator color={Cores.texto} />
            ) : (
              <Text style={styles.textoBotao}>Criar conta</Text>
            )}
          </Pressable>

          <Pressable
            style={styles.trocar}
            onPress={() => router.replace('/entrar')}
            disabled={enviando}>
            <Text style={styles.textoTrocar}>
              Já tem conta? <Text style={styles.link}>Entrar</Text>
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
  voltar: {
    width: 40,
    height: 40,
    marginLeft: -Espacamento.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    color: Cores.texto,
    fontSize: Fonte.heroi,
    fontWeight: '800',
    marginTop: Espacamento.lg,
  },
  subtitulo: {
    color: Cores.textoSecundario,
    fontSize: Fonte.corpo,
    lineHeight: 22,
    marginTop: Espacamento.sm,
  },
  formulario: { marginTop: Espacamento.xl, gap: Espacamento.sm },
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
  trocar: { alignItems: 'center', paddingVertical: Espacamento.lg },
  textoTrocar: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  link: { color: Cores.marca, fontWeight: '700' },
});
