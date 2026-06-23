# Project Map

Este arquivo resume onde cada parte principal do JoinUp vive. A ideia e facilitar a leitura do repositorio no GitHub sem precisar abrir arquivo por arquivo.

## Telas principais

| Area | Arquivo |
| --- | --- |
| Landing page | `src/html/index.html` |
| Selecionar perfil de login | `src/html/login.html` |
| Cadastro geral | `src/html/cadastro.html` |
| Feed do participante | `src/html/feed.html` |
| Painel do organizador | `src/html/organizador.html` |
| Painel de suporte | `src/html/suporte.html` |

## CSS

| Arquivo | Responsabilidade |
| --- | --- |
| `src/Css/styles.css` | Landing page e estilos globais da entrada |
| `src/Css/feed.css` | Feed, participante e componentes sociais |
| `src/Css/organizador.css` | Painel do organizador |
| `src/Css/suporte.css` | Painel de suporte |
| `src/Css/login.css` | Login, cadastro e telas auxiliares |
| `src/Css/comunidades.css` | Tela auxiliar de comunidades |

## JavaScript

| Arquivo | Responsabilidade |
| --- | --- |
| `src/js/script.js` | Interacoes da landing page |
| `src/js/feed.js` | Feed, eventos, comunidades, tickets e revenda do participante |
| `src/js/organizador.js` | Dashboard, criacao de eventos, metricas e suporte do organizador |
| `src/js/suporte.js` | Dashboard de suporte |
| `src/js/login*.js` | Fluxos de login por perfil |
| `src/js/cadastro*.js` | Fluxos de cadastro por perfil |

## PHP

| Grupo | Arquivos |
| --- | --- |
| Conexao | `src/php/conexao.php` |
| Autenticacao | `login*.php`, `cadastro*.php`, `logout.php`, `check_auth.php` |
| Eventos e ingressos | `eventos.php`, `criar-evento.php`, `comprar_ingresso.php`, `get_meus_ingressos.php` |
| Feed social | `social.php`, `comunidades.php`, `comunidade_feed.php`, `get_minhas_postagens.php` |
| Revenda | `create_revenda_anuncio.php`, `get_revenda_anuncios.php`, `comprar_ingresso_revenda.php` |
| Suporte | `create_ticket.php`, `get_support_tickets.php`, `respond_support_ticket.php`, `close_support_ticket.php` |

## Assets e uploads

- `src/assets/images/landing`: imagens estaticas usadas pela landing.
- `src/uploads`: imagens de posts e dados demo usados pelo seed.
