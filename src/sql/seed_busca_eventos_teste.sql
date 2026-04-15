-- Seed de teste para busca de eventos (MySQL / phpMyAdmin)
-- Pode executar mais de uma vez sem duplicar os registros principais.

START TRANSACTION;

-- 1) Generos musicais basicos
INSERT INTO generos_musicais (nome)
SELECT 'Rock'
WHERE NOT EXISTS (
    SELECT 1 FROM generos_musicais WHERE nome = 'Rock'
);

INSERT INTO generos_musicais (nome)
SELECT 'Pop'
WHERE NOT EXISTS (
    SELECT 1 FROM generos_musicais WHERE nome = 'Pop'
);

INSERT INTO generos_musicais (nome)
SELECT 'Eletronico'
WHERE NOT EXISTS (
    SELECT 1 FROM generos_musicais WHERE nome = 'Eletronico'
);

-- 2) Organizadores de teste
INSERT INTO organizadores (nome, email, senha, cnpj)
SELECT 'Organizador Teste 1', 'org.teste1@joinup.local', 'senha_teste_123', '11.222.333/0001-81'
WHERE NOT EXISTS (
    SELECT 1 FROM organizadores WHERE cnpj = '11.222.333/0001-81'
);

INSERT INTO organizadores (nome, email, senha, cnpj)
SELECT 'Organizador Teste 2', 'org.teste2@joinup.local', 'senha_teste_456', '22.333.444/0001-82'
WHERE NOT EXISTS (
    SELECT 1 FROM organizadores WHERE cnpj = '22.333.444/0001-82'
);

-- 3) Busca dos IDs para relacionamentos
SET @id_genero_rock = (
    SELECT id_genero_musical
    FROM generos_musicais
    WHERE nome = 'Rock'
    ORDER BY id_genero_musical
    LIMIT 1
);

SET @id_genero_pop = (
    SELECT id_genero_musical
    FROM generos_musicais
    WHERE nome = 'Pop'
    ORDER BY id_genero_musical
    LIMIT 1
);

SET @id_genero_eletronico = (
    SELECT id_genero_musical
    FROM generos_musicais
    WHERE nome = 'Eletronico'
    ORDER BY id_genero_musical
    LIMIT 1
);

SET @id_org_1 = (
    SELECT id_organizador
    FROM organizadores
    WHERE cnpj = '11.222.333/0001-81'
    LIMIT 1
);

SET @id_org_2 = (
    SELECT id_organizador
    FROM organizadores
    WHERE cnpj = '22.333.444/0001-82'
    LIMIT 1
);

-- 4) Eventos de teste para validar pesquisa por nome, descricao e local
INSERT INTO eventos (nome, data, descricao, localizacao, id_genero_musical, id_organizador)
SELECT
    'Rock na Praca Teste',
    '2026-06-20 20:00:00',
    'Evento de teste para validar busca por rock e por Sao Paulo.',
    'Sao Paulo - SP',
    @id_genero_rock,
    @id_org_1
WHERE NOT EXISTS (
    SELECT 1
    FROM eventos
    WHERE nome = 'Rock na Praca Teste'
      AND data = '2026-06-20 20:00:00'
      AND id_organizador = @id_org_1
);

INSERT INTO eventos (nome, data, descricao, localizacao, id_genero_musical, id_organizador)
SELECT
    'Festival Neon SP Teste',
    '2026-07-12 22:00:00',
    'Festival com DJs e pista open air para teste da busca por neon.',
    'Sao Paulo - SP',
    @id_genero_eletronico,
    @id_org_1
WHERE NOT EXISTS (
    SELECT 1
    FROM eventos
    WHERE nome = 'Festival Neon SP Teste'
      AND data = '2026-07-12 22:00:00'
      AND id_organizador = @id_org_1
);

INSERT INTO eventos (nome, data, descricao, localizacao, id_genero_musical, id_organizador)
SELECT
    'Pop Night RJ Teste',
    '2026-08-05 21:30:00',
    'Show pop para testar busca por genero, cidade e descricao.',
    'Rio de Janeiro - RJ',
    @id_genero_pop,
    @id_org_2
WHERE NOT EXISTS (
    SELECT 1
    FROM eventos
    WHERE nome = 'Pop Night RJ Teste'
      AND data = '2026-08-05 21:30:00'
      AND id_organizador = @id_org_2
);

INSERT INTO eventos (nome, data, descricao, localizacao, id_genero_musical, id_organizador)
SELECT
    'Sunset BH Teste',
    '2026-09-14 18:00:00',
    'Evento sunset para validar filtro por cidade em Belo Horizonte.',
    'Belo Horizonte - MG',
    @id_genero_eletronico,
    @id_org_2
WHERE NOT EXISTS (
    SELECT 1
    FROM eventos
    WHERE nome = 'Sunset BH Teste'
      AND data = '2026-09-14 18:00:00'
      AND id_organizador = @id_org_2
);

COMMIT;

-- 5) Validacao rapida (opcional)
SELECT
    e.id_evento,
    e.nome,
    DATE_FORMAT(e.data, '%d/%m/%Y %H:%i') AS data_formatada,
    e.localizacao,
    gm.nome AS genero,
    o.nome AS organizador
FROM eventos e
LEFT JOIN generos_musicais gm ON gm.id_genero_musical = e.id_genero_musical
LEFT JOIN organizadores o ON o.id_organizador = e.id_organizador
ORDER BY e.data ASC;
