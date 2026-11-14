# Crunchyroll — aplicativo híbrido

Aplicativo em React Native com Expo que recria a experiência de um serviço de
streaming de animes. O catálogo vem de uma API pública real e os dados do
usuário (lista, histórico, preferências e sessão) ficam guardados no aparelho.

Trabalho da disciplina de Aplicativos Híbridos (Univassouras).

## Como executar

```bash
npm install
npx expo start
```

Abra no aplicativo **Expo Go** lendo o QR code. Em redes que isolam os
aparelhos entre si, use `npx expo start --tunnel`. Para abrir no navegador,
`npx expo start --web`.

Para entrar, use a conta de demonstração da API DummyJSON (há um botão na tela
de login que preenche sozinho):

| Usuário | Senha |
| --- | --- |
| `emilys` | `emilyspass` |

## Telas (17)

| Rota | Arquivo | Tela |
| --- | --- | --- |
| `/boas-vindas` | `(auth)/boas-vindas.tsx` | Apresentação do primeiro uso, em páginas |
| `/entrar` | `(auth)/entrar.tsx` | Login com validação e conta de demonstração |
| `/` | `(app)/(abas)/index.tsx` | Início: destaque, continuar assistindo e carrosséis |
| `/busca` | `(app)/(abas)/busca.tsx` | Busca paginada, buscas recentes e gêneros |
| `/simulcast` | `(app)/(abas)/simulcast.tsx` | Lançamentos de cada dia da semana |
| `/lista` | `(app)/(abas)/lista.tsx` | Minha lista com ordenação e edição |
| `/perfil` | `(app)/(abas)/perfil.tsx` | Usuário, estatísticas, dados da conta e sair |
| `/anime/:id` | `(app)/anime/[id]/index.tsx` | Detalhe com episódios, sinopse e recomendações |
| `/anime/:id/personagens` | `(app)/anime/[id]/personagens.tsx` | Elenco completo, paginado |
| `/personagem/:id` | `(app)/personagem/[id].tsx` | Ficha do personagem |
| `/genero/:nome` | `(app)/genero/[nome].tsx` | Animes de um gênero, em grade paginada |
| `/ranking` | `(app)/ranking.tsx` | Ranking por critério (em alta, temporada, populares, melhores) |
| `/player/:animeId?episodio=N` | `(app)/player/[animeId].tsx` | Reprodução simulada com progresso salvo |
| `/historico` | `(app)/historico.tsx` | Histórico de reprodução |
| `/configuracoes` | `(app)/configuracoes.tsx` | Preferências e armazenamento |
| `/sobre` | `(app)/sobre.tsx` | Versão, APIs, tecnologias e autores |
| qualquer outra | `+not-found.tsx` | Página não encontrada |

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

## APIs

| API | Tipo | Uso |
| --- | --- | --- |
| [AniList](https://docs.anilist.co) | GraphQL (`POST https://graphql.anilist.co`) | Catálogo, busca, episódios, personagens, ranking, grade semanal |
| [DummyJSON](https://dummyjson.com/docs/auth) | REST (`POST /auth/login`, `GET /auth/me`) | Login com token JWT e perfil |

Toda requisição passa por `services/api.ts`: tempo limite com
`AbortController`, verificação de `response.ok`, mensagens de erro por código
HTTP e uma nova tentativa em falha de rede ou erro 5xx.

## Armazenamento local

| Onde | O quê |
| --- | --- |
| AsyncStorage (`services/storage.ts`, prefixo `app:v1:`) | Minha lista e histórico (por usuário), preferências, buscas recentes, perfil da sessão |
| AsyncStorage (`services/cache.ts`) | Respostas da API com validade; sem internet, devolve a última resposta guardada |
| SecureStore (`services/seguro.ts`) | Token de acesso, criptografado no Keystore/Keychain |

O hook `usePersistedState` funciona como o `useState`, mas grava cada mudança
no AsyncStorage. O `NetInfo` mostra uma faixa quando a conexão cai e recarrega
as telas quando ela volta.

## Organização

```
src/
  app/          rotas (a estrutura de pastas define a navegação)
  componentes/  componentes reutilizáveis (cartaz, carrossel, estados de tela)
  constants/    cores, espaçamentos e tipografia
  contextos/    sessão, minha lista, histórico e preferências
  hooks/        useFetch, usePaginacao, useDebounce, usePersistedState, useConexao
  services/     cliente HTTP, APIs, armazenamento, cache e cofre seguro
```

## Verificações

```bash
npx tsc --noEmit                 # tipos
npx eslint . --max-warnings 0    # análise estática
```

## Autores

Daniel Alvarez Gonçalves e Clara Moledo.
