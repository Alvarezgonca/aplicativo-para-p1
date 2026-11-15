# Crunchyroll — aplicativo híbrido

Aplicativo em React Native com Expo que recria a experiência de um serviço de
streaming de animes. O catálogo vem de uma API pública real (AniList). A conta
do usuário, a lista e o histórico ficam na nossa própria API, em Node.js com
PostgreSQL, então tudo continua lá ao trocar de celular ou reinstalar o app.

Trabalho da disciplina de Aplicativos Híbridos (Univassouras).

## Como executar

### Só o aplicativo (usa a API já publicada)

```bash
npm install
npx expo start
```

Abra no aplicativo **Expo Go** lendo o QR code. Em redes que isolam os
aparelhos entre si, use `npx expo start --tunnel`. Para abrir no navegador,
`npx expo start --web`.

Por padrão o app conversa com a API publicada em
`https://animes-api.kogaip.com/v1` (documentação em
[/docs](https://animes-api.kogaip.com/docs)).

Para entrar, crie uma conta na tela de cadastro ou use a conta de demonstração
(há um botão na tela de login que preenche sozinho):

| E-mail             | Senha      |
| ------------------ | ---------- |
| `demo@exemplo.com` | `demo1234` |

### Aplicativo e API na sua máquina

Precisa de Docker. O `docker compose` sobe a API e o PostgreSQL; as tabelas e
a conta de demonstração são criadas sozinhas na primeira subida.

```bash
cd api
cp .env.example .env     # troque a senha do banco e a chave dos tokens
docker compose up -d
```

A API fica em `http://localhost:3000` e a documentação em
`http://localhost:3000/docs`. Para o app usar essa API, crie um `.env` na raiz
do projeto com o IP do computador na rede (o celular não enxerga `localhost`):

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000/v1
```

e rode `npx expo start` de novo.

## Arquitetura

```
 celular (Expo)                 servidor                       banco
 ┌──────────────┐  HTTPS/JSON  ┌──────────────────────┐  SQL  ┌────────────┐
 │ telas        │ ───────────► │ API Node.js/Express  │ ────► │ PostgreSQL │
 │ AsyncStorage │  token JWT   │ rotas → controllers  │       └────────────┘
 │ SecureStore  │ ◄─────────── │ → services → models  │
 └──────┬───────┘              └──────────────────────┘
        │ GraphQL
        ▼
   AniList (catálogo)
```

O celular nunca fala com o banco: só a API conhece a senha dele. O app guarda
uma cópia local da lista e do histórico e uma fila do que ainda não foi
enviado, então funciona sem internet e sincroniza quando a conexão volta.

## Telas (19)

| Rota                          | Arquivo                            | Tela                                                           |
| ----------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| `/boas-vindas`                | `(auth)/boas-vindas.tsx`           | Apresentação do primeiro uso, em páginas                       |
| `/entrar`                     | `(auth)/entrar.tsx`                | Login com validação e conta de demonstração                    |
| `/cadastro`                   | `(auth)/cadastro.tsx`              | Criação de conta                                               |
| `/`                           | `(app)/(abas)/index.tsx`           | Início: destaque, continuar assistindo e carrosséis            |
| `/busca`                      | `(app)/(abas)/busca.tsx`           | Busca paginada, buscas recentes e gêneros                      |
| `/simulcast`                  | `(app)/(abas)/simulcast.tsx`       | Lançamentos de cada dia da semana                              |
| `/lista`                      | `(app)/(abas)/lista.tsx`           | Minha lista com ordenação e edição                             |
| `/perfil`                     | `(app)/(abas)/perfil.tsx`          | Conta, estatísticas, sincronização e sair                      |
| `/anime/:id`                  | `(app)/anime/[id]/index.tsx`       | Detalhe com episódios, sinopse e recomendações                 |
| `/anime/:id/personagens`      | `(app)/anime/[id]/personagens.tsx` | Elenco completo, paginado                                      |
| `/personagem/:id`             | `(app)/personagem/[id].tsx`        | Ficha do personagem                                            |
| `/genero/:nome`               | `(app)/genero/[nome].tsx`          | Animes de um gênero, em grade paginada                         |
| `/ranking`                    | `(app)/ranking.tsx`                | Ranking por critério (em alta, temporada, populares, melhores) |
| `/player/:animeId?episodio=N` | `(app)/player/[animeId].tsx`       | Reprodução simulada com progresso salvo                        |
| `/historico`                  | `(app)/historico.tsx`              | Histórico de reprodução                                        |
| `/configuracoes`              | `(app)/configuracoes.tsx`          | Preferências e armazenamento                                   |
| `/excluir-conta`              | `(app)/excluir-conta.tsx`          | Exclusão da conta com confirmação de senha                     |
| `/sobre`                      | `(app)/sobre.tsx`                  | Versão, APIs, tecnologias e autores                            |
| qualquer outra                | `+not-found.tsx`                   | Página não encontrada                                          |

## Navegação (Expo Router)

- **Pilha raiz** (`app/_layout.tsx`) com dois grupos: `(auth)` e `(app)`. Os
  parênteses organizam as pastas sem entrar na URL.
- **`(app)/_layout.tsx`** protege as telas: sem sessão, `Redirect` para a
  apresentação ou para o login. **`(auth)/_layout.tsx`** faz o inverso.
- **Abas** em `(app)/(abas)/_layout.tsx` (Início, Buscar, Simulcast, Lista e
  Perfil). Detalhe, ranking, player e as demais telas são empilhados por cima
  das abas.
- **Rotas dinâmicas** (`[id]`, `[nome]`, `[animeId]`), rota aninhada
  (`anime/[id]/personagens`) e parâmetros de busca (`?episodio=3`,
  `?criterio=melhores`).
- `router.push` empilha, `router.replace` troca a tela atual (login, próximo
  episódio) e `router.back` volta.

## APIs consumidas

| API                                | Tipo                                        | Uso                                                             |
| ---------------------------------- | ------------------------------------------- | --------------------------------------------------------------- |
| API do aplicativo (pasta `api/`)   | REST com JWT                                | Cadastro, login, conta, minha lista e histórico                 |
| [AniList](https://docs.anilist.co) | GraphQL (`POST https://graphql.anilist.co`) | Catálogo, busca, episódios, personagens, ranking, grade semanal |

Toda requisição passa por `services/api.ts`: tempo limite com
`AbortController`, verificação de `response.ok`, mensagem de erro vinda do
servidor e nova tentativa só em requisições que podem ser repetidas sem efeito
colateral. `services/api-app.ts` coloca o token no cabeçalho `Authorization` e
renova a sessão sozinho quando o token de acesso vence.

## API do aplicativo (`api/`)

Node.js 24, Express 5, Sequelize (ORM) e PostgreSQL 17, organizada em camadas:

```
api/src/
  routes/        caminhos e middlewares de cada recurso
  controllers/   recebem o pedido e montam a resposta
  services/      regras de autenticação e tokens
  models/        tabelas do banco (Sequelize)
  validators/    esquemas Joi de cada entrada
  middlewares/   autenticação, validação, limites, log e erros
  database/      conexão, migrations e conta de demonstração
  docs/          especificação OpenAPI (Swagger em /docs)
```

| Método e rota                          | O que faz                                  |
| -------------------------------------- | ------------------------------------------ |
| `POST /v1/auth/cadastro`               | Cria a conta e já devolve os tokens        |
| `POST /v1/auth/entrar`                 | Login com e-mail e senha                   |
| `POST /v1/auth/renovar`                | Troca o token de renovação por um par novo |
| `POST /v1/auth/sair`                   | Encerra a sessão no servidor               |
| `GET /v1/usuarios/eu`                  | Dados da conta logada                      |
| `DELETE /v1/usuarios/eu`               | Exclui a conta (pede a senha)              |
| `GET /v1/lista`                        | Minha lista                                |
| `PUT /v1/lista/:animeId`               | Adiciona ou atualiza um anime na lista     |
| `DELETE /v1/lista/:animeId`            | Tira um anime da lista                     |
| `GET /v1/historico`                    | Histórico de reprodução                    |
| `PUT /v1/historico/:animeId/:episodio` | Registra o progresso de um episódio        |
| `DELETE /v1/historico`                 | Limpa o histórico                          |
| `GET /saude`                           | Verificação de saúde (API e banco)         |

Banco: tabelas `usuarios`, `sessoes`, `itens_lista` e `registros_historico`,
criadas por migrations e ligadas por chave estrangeira com exclusão em cascata.

### Segurança

- Senhas guardadas só como hash **bcrypt**; e-mail e senha errados dão a mesma
  resposta, para não revelar quais e-mails têm conta.
- **Token de acesso JWT** de 15 minutos e **token de renovação** aleatório de
  30 dias, trocado a cada uso; no banco fica só o hash dele.
- No celular, os dois tokens ficam no **SecureStore** (Keystore/Keychain).
- Toda entrada validada com **Joi**; cada usuário só enxerga os próprios dados
  (o id vem do token, nunca da URL).
- **Limite de tentativas** no login e no cadastro, cabeçalhos de segurança com
  **helmet**, CORS restrito e erros internos sem detalhes para o cliente.
- Segredos fora do código: `.env` no desenvolvimento e arquivos de segredo do
  Docker no servidor. O banco não fica exposto na rede.

## Armazenamento local

| Onde                                                    | O quê                                                                                                      |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| SecureStore (`services/seguro.ts`)                      | Tokens de acesso e de renovação, criptografados                                                            |
| AsyncStorage (`services/storage.ts`, prefixo `app:v1:`) | Cópia local da lista e do histórico, fila de sincronização, preferências, buscas recentes, dados da sessão |
| AsyncStorage (`services/cache.ts`)                      | Respostas da API com validade; sem internet, devolve a última resposta guardada                            |

O hook `usePersistedState` funciona como o `useState`, mas grava cada mudança
no AsyncStorage. O `NetInfo` mostra uma faixa quando a conexão cai, e ao voltar
a fila de sincronização (`services/sincronizacao.ts`) envia o que ficou
pendente, na ordem em que foi feito.

## Organização

```
api/            API REST, banco e testes
src/
  app/          rotas (a estrutura de pastas define a navegação)
  componentes/  componentes reutilizáveis (cartaz, carrossel, estados de tela)
  constants/    cores, espaçamentos e tipografia
  contextos/    sessão, minha lista, histórico e preferências
  hooks/        useFetch, usePaginacao, useDebounce, usePersistedState, useConexao
  services/     clientes HTTP, autenticação, sincronização, cache e cofre seguro
```

## Verificações

```bash
npx tsc --noEmit                 # tipos do aplicativo
npx eslint . --max-warnings 0    # análise estática (app e API)
cd api && npm test               # testes da API (precisa de um PostgreSQL)
```

## Autores

Daniel Alvarez Gonçalves e Clara Moledo.
