# Checklist de Publicacao

Use este checklist antes de subir o projeto para o GitHub ou apresentar o MVP.

## Repositorio

- `README.md` atualizado.
- `.gitignore`, `.editorconfig` e `.gitattributes` presentes.
- Sem arquivos de sistema como `.DS_Store`, `Thumbs.db` ou `desktop.ini`.
- Sem pasta `.vscode` versionada.
- Sem endpoints de debug expondo dados de sessao.

## Validacao tecnica

```powershell
Get-ChildItem src\php -Filter *.php | ForEach-Object { C:\xampp\php\php.exe -l $_.FullName }
Get-ChildItem src\js -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## Fluxos para testar

- Landing abre em `src/html/index.html`.
- Cadastro e login de participante.
- Feed com posts, eventos e comunidades.
- Compra de ingresso.
- Criacao de anuncio de revenda.
- Login do organizador e criacao de evento.
- Login do suporte e resposta de ticket.

## Contas demo

Senha para todas: `123456`.

- Participante: `ana.ribeiro@joinup.local`
- Organizador: `demo.organizador@joinup.local`
- Suporte: `suporte@joinup.local`
