# Crunchyroll — reprodução de interface

Aplicativo híbrido que reproduz a interface do Crunchyroll em React Native com
Expo. Todo o conteúdo é estático: o aplicativo não consulta nenhum serviço
externo em tempo de execução.

Trabalho da disciplina de Aplicativos Híbridos.

## Como executar

```bash
npm install
npx expo start
```

Abra o projeto no aplicativo **Expo Go**, lendo o QR code ou selecionando o
servidor na mesma rede. Em redes que isolam os dispositivos entre si, use
`npx expo start --tunnel`.

## Telas

| Rota | Tela |
| --- | --- |
| `(abas)/index` | Início, com banner rotativo, continuidade e coleções |
| `(abas)/busca` | Busca com filtro em tempo real e exploração por gênero |
| `(abas)/simulcast` | Calendário semanal de lançamentos |
| `(abas)/lista` | Títulos salvos, em grade |
| `(abas)/perfil` | Perfil, estatísticas e preferências |
| `anime/[id]` | Detalhe do título, com abas de episódios e informações |
| `player/[episodioId]` | Reprodução |

## Organização

```
src/
  app/          rotas (a estrutura de arquivos define a navegação)
  componentes/  componentes reutilizáveis
  constants/    paleta, espaçamentos e tipografia
  contextos/    estado compartilhado entre telas
  dados/        catálogo, episódios, coleções e grade de simulcast
```

## Verificações

```bash
npx tsc --noEmit   # tipos
npx eslint .       # análise estática
```

## Autores

Daniel Alvarez Gonçalves e Clara Moledo.
