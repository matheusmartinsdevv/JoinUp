# Banco de Dados

O JoinUp usa MySQL/MariaDB com o banco `joinup`.

## Arquivo principal

`src/sql/joinup_schema_atualizado.sql`

Esse script recria o schema completo e cadastra generos/artistas basicos.

## Ordem recomendada

Execute os scripts nesta ordem em uma base limpa:

```powershell
Get-Content -Raw .\src\sql\joinup_schema_atualizado.sql | C:\xampp\mysql\bin\mysql.exe -u root
Get-Content -Raw .\src\sql\migration_comunidade_mensagens.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_social_feed.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_tabelas_compra.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\migration_eventos_imagens_reais.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
Get-Content -Raw .\src\sql\seed_feed_social.sql | C:\xampp\mysql\bin\mysql.exe -u root joinup
```

## Dados demo

O seed `src/sql/seed_feed_social.sql` cria:

- organizador demo;
- suporte demo;
- participantes demo;
- eventos com imagens reais via URL;
- comunidades;
- posts, comentarios e curtidas;
- ingressos;
- anuncios de revenda;
- mensagens de comunidade.

Todas as contas demo usam a senha `123456`.

## Conexao local

A conexao fica em `src/php/conexao.php`:

```php
$host = "localhost";
$usuario = "root";
$senha_db = "";
$nome_banco = "joinup";
```

Para publicar fora do XAMPP, ajuste esses valores de acordo com o servidor.
