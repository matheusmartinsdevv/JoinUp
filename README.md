# JoinUp

JoinUp e uma plataforma social para eventos. O projeto junta descoberta de eventos, feed, comunidades, compra de ingressos, revenda, painel do organizador e atendimento em um app PHP/MySQL simples de rodar no XAMPP.

## Features

- Landing page responsiva com identidade visual de eventos.
- Cadastro e login para participantes, organizadores e suporte.
- Feed social com posts, comentarios, curtidas, comunidades e cards de eventos.
- Compra de ingressos, area de meus ingressos e fluxo de revenda segura.
- Painel do organizador com criacao de eventos, tipos de ingresso, comunidades, metricas e chamados.
- Painel de suporte para acompanhar e responder tickets.
- Seed demo com eventos, fotos reais via links, comunidades, posts, ingressos e contas de teste.

## Stack

- PHP
- MySQL/MariaDB
- HTML, CSS e JavaScript puro
- XAMPP para ambiente local

## Entradas principais

| Area | URL local |
| --- | --- |
| Landing | `http://localhost/JoinUp/src/html/index.html` |
| Login geral | `http://localhost/JoinUp/src/html/login.html` |
| Feed do participante | `http://localhost/JoinUp/src/html/feed.html` |
| Painel do organizador | `http://localhost/JoinUp/src/html/organizador.html` |
| Painel de suporte | `http://localhost/JoinUp/src/html/suporte.html` |

## Como rodar localmente

1. Clone ou copie o projeto para a pasta do XAMPP:

```powershell
C:\xampp\htdocs\JoinUp
```

2. Inicie Apache e MySQL no painel do XAMPP.

3. Crie o banco importando o schema:

```powershell
Get-Content -Raw .\src\sql\joinup_schema_atualizado.sql | C:\xampp\mysql\bin\mysql.exe -u root
```

4. Importe as migrations e os dados demo:

```powershell
Get-Content -Raw .\src\sql\migration_comunidade_mensagens.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_social_feed.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_tabelas_compra.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_eventos_imagens_reais.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\seed_feed_social.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
```

5. Acesse:

```text
http://localhost/JoinUp/src/html/index.html
```

## Contas demo

Todas usam a senha `123456`.

| Perfil | E-mail |
| --- | --- |
| Participante | `ana.ribeiro@joinup.local` |
| Organizador | `demo.organizador@joinup.local` |
| Suporte | `suporte@joinup.local` |

## Estrutura

```text
JoinUp/
|-- README.md
|-- docs/
|-- src/
|   |-- assets/
|   |-- Css/
|   |-- html/
|   |-- js/
|   |-- php/
|   |-- sql/
|   `-- uploads/
|-- .editorconfig
|-- .gitattributes
`-- .gitignore
```

## Documentacao

- [Mapa do projeto](docs/PROJECT_MAP.md)
- [Banco de dados e scripts SQL](docs/DATABASE.md)
- [Checklist de publicacao](docs/PUBLISHING_CHECKLIST.md)

## Antes de publicar

Rode as validacoes basicas:

```powershell
Get-ChildItem src\php -Filter *.php | ForEach-Object { C:\xampp\php\php.exe -l $_.FullName }
Get-ChildItem src\js -Filter *.js | ForEach-Object { node --check $_.FullName }
```

Depois teste login, feed, criacao de evento, compra/revenda e suporte pelo navegador.
