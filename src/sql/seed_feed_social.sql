-- Seed para preencher o feed social do JoinUp.
-- Pode ser executado mais de uma vez sem duplicar os registros principais.

USE `joinup`;

SET NAMES utf8mb4;

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `postagem_curtidas` (
  `id_participante` INT NOT NULL,
  `id_postagem` INT NOT NULL,
  `data_curtida` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_participante`, `id_postagem`),
  INDEX `idx_postagem_curtidas_postagem` (`id_postagem` ASC),
  CONSTRAINT `fk_postagem_curtidas_participantes`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_postagem_curtidas_postagens`
    FOREIGN KEY (`id_postagem`)
    REFERENCES `postagens` (`id_postagem`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

INSERT INTO `generos_musicais` (`nome`)
SELECT 'Eletronica'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` LIKE 'Eletr%');

INSERT INTO `generos_musicais` (`nome`)
SELECT 'Rock'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` = 'Rock');

INSERT INTO `generos_musicais` (`nome`)
SELECT 'Pagode'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` = 'Pagode');

INSERT INTO `generos_musicais` (`nome`)
SELECT 'Pop'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` = 'Pop');

INSERT INTO `generos_musicais` (`nome`)
SELECT 'Trap'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` = 'Trap');

INSERT INTO `generos_musicais` (`nome`)
SELECT 'MPB'
WHERE NOT EXISTS (SELECT 1 FROM `generos_musicais` WHERE `nome` = 'MPB');

SET @id_genero_eletronica = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` LIKE 'Eletr%' ORDER BY `id_genero_musical` LIMIT 1
);
SET @id_genero_rock = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` = 'Rock' ORDER BY `id_genero_musical` LIMIT 1
);
SET @id_genero_pagode = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` = 'Pagode' ORDER BY `id_genero_musical` LIMIT 1
);
SET @id_genero_pop = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` = 'Pop' ORDER BY `id_genero_musical` LIMIT 1
);
SET @id_genero_trap = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` = 'Trap' ORDER BY `id_genero_musical` LIMIT 1
);
SET @id_genero_mpb = (
  SELECT `id_genero_musical` FROM `generos_musicais` WHERE `nome` = 'MPB' ORDER BY `id_genero_musical` LIMIT 1
);

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Alok', '22233344455'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` = 'Alok');

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Vintage Culture', '00011122233'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` = 'Vintage Culture');

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Ludmilla', '33344455566'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` = 'Ludmilla');

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Matue', '55566677788'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` IN ('Matue', 'Matuê'));

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Djavan', '88899900011'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` = 'Djavan');

INSERT INTO `artistas` (`nome`, `cpf`)
SELECT 'Banda Aurora', '90000000010'
WHERE NOT EXISTS (SELECT 1 FROM `artistas` WHERE `nome` = 'Banda Aurora');

INSERT INTO `organizadores` (`nome`, `email`, `senha`, `cnpj`)
SELECT 'JoinUp Producoes Demo', 'demo.organizador@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam', '90.000.000/0001-90'
WHERE NOT EXISTS (
  SELECT 1 FROM `organizadores`
  WHERE `email` = 'demo.organizador@joinup.local'
     OR `cnpj` = '90.000.000/0001-90'
);

SET @id_org_joinup = (
  SELECT `id_organizador`
  FROM `organizadores`
  WHERE `email` = 'demo.organizador@joinup.local'
     OR `cnpj` = '90.000.000/0001-90'
  ORDER BY `id_organizador`
  LIMIT 1
);

INSERT INTO `usuarios_suporte` (`nome`, `email`, `senha`)
SELECT 'Suporte JoinUp Demo', 'suporte@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (
  SELECT 1 FROM `usuarios_suporte`
  WHERE `email` = 'suporte@joinup.local'
);

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000001', 'Ana Ribeiro', '1997-05-12', 'ana.ribeiro@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000001' OR `email` = 'ana.ribeiro@joinup.local');

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000002', 'Bruno Lima', '1996-11-03', 'bruno.lima@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000002' OR `email` = 'bruno.lima@joinup.local');

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000003', 'Camila Torres', '1999-02-18', 'camila.torres@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000003' OR `email` = 'camila.torres@joinup.local');

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000004', 'Diego Souza', '1995-08-27', 'diego.souza@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000004' OR `email` = 'diego.souza@joinup.local');

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000005', 'Fernanda Rocha', '1998-09-09', 'fernanda.rocha@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000005' OR `email` = 'fernanda.rocha@joinup.local');

INSERT INTO `participantes` (`cpf`, `nome`, `data_nascimento`, `email`, `senha`)
SELECT '90000000006', 'Mariana Prado', '2000-01-21', 'mariana.prado@joinup.local', '$2y$10$nv14addTsAC2sDa18ril3ONInGWX/MDKqWegYEmoFZhYHLeTmIsam'
WHERE NOT EXISTS (SELECT 1 FROM `participantes` WHERE `cpf` = '90000000006' OR `email` = 'mariana.prado@joinup.local');

SET @id_ana = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'ana.ribeiro@joinup.local' LIMIT 1);
SET @id_bruno = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'bruno.lima@joinup.local' LIMIT 1);
SET @id_camila = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'camila.torres@joinup.local' LIMIT 1);
SET @id_diego = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'diego.souza@joinup.local' LIMIT 1);
SET @id_fernanda = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'fernanda.rocha@joinup.local' LIMIT 1);
SET @id_mariana = (SELECT `id_participante` FROM `participantes` WHERE `email` = 'mariana.prado@joinup.local' LIMIT 1);
SET @id_kauan = (SELECT `id_participante` FROM `participantes` WHERE `cpf` = '11111111111' LIMIT 1);
SET @id_autor_local = COALESCE(@id_kauan, @id_ana);

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'Festival Neon JoinUp', '2026-07-18 21:00:00', 'Noite de DJs, luzes e encontros de comunidade para abrir a temporada do JoinUp.', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', 'Arena Anhembi', 'Sao Paulo', 'SP', '02012000', @id_org_joinup, @id_genero_eletronica
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'Festival Neon JoinUp');

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'Rock na Estacao', '2026-07-26 19:30:00', 'Bandas autorais, classicos de guitarra e uma comunidade pronta para organizar caronas.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', 'Estacao Rock', 'Curitiba', 'PR', '80230110', @id_org_joinup, @id_genero_rock
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'Rock na Estacao');

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'Pagode do Fim de Semana', '2026-08-09 16:00:00', 'Roda de pagode, convidados especiais e area aberta para curtir o por do sol.', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80', 'Pier Maua', 'Rio de Janeiro', 'RJ', '20081120', @id_org_joinup, @id_genero_pagode
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'Pagode do Fim de Semana');

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'Pop Sunset Recife', '2026-08-22 20:00:00', 'Show pop com pista colorida, espaco para fotos e encontro oficial no Marco Zero.', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80', 'Marco Zero', 'Recife', 'PE', '50030000', @id_org_joinup, @id_genero_pop
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'Pop Sunset Recife');

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'Trap Lab BH', '2026-09-05 22:00:00', 'Experiencia de trap, bass pesado e after organizado pela comunidade oficial.', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', 'Mineirao Hall', 'Belo Horizonte', 'MG', '31275000', @id_org_joinup, @id_genero_trap
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'Trap Lab BH');

INSERT INTO `eventos` (`nome`, `data`, `descricao`, `imagem`, `localizacao`, `cidade`, `estado`, `cep`, `id_organizador`, `id_genero_musical`)
SELECT 'MPB no Parque', '2026-09-19 17:00:00', 'Fim de tarde com voz, violao, food trucks e ponto de encontro para grupos de amigos.', 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80', 'Parque Portugal', 'Campinas', 'SP', '13092000', @id_org_joinup, @id_genero_mpb
WHERE NOT EXISTS (SELECT 1 FROM `eventos` WHERE `nome` = 'MPB no Parque');

SET @id_event_neon = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'Festival Neon JoinUp' LIMIT 1);
SET @id_event_rock = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'Rock na Estacao' LIMIT 1);
SET @id_event_pagode = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'Pagode do Fim de Semana' LIMIT 1);
SET @id_event_pop = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'Pop Sunset Recife' LIMIT 1);
SET @id_event_trap = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'Trap Lab BH' LIMIT 1);
SET @id_event_mpb = (SELECT `id_evento` FROM `eventos` WHERE `nome` = 'MPB no Parque' LIMIT 1);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: Festival Neon JoinUp', 'Combine chegada, fotos, caronas e after oficial do Festival Neon.', 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80', @id_event_neon
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_neon);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: Rock na Estacao', 'Ponto de encontro para fas de guitarra, bandas e caronas para a estacao.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80', @id_event_rock
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_rock);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: Pagode do Fim de Semana', 'Grupo para organizar roda, fotos, transporte e chegada no Pier.', 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80', @id_event_pagode
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_pagode);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: Pop Sunset Recife', 'Looks, afters, melhores entradas e combinados para o Pop Sunset.', 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80', @id_event_pop
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_pop);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: Trap Lab BH', 'Meetup, line-up, bass e dicas para a noite do Trap Lab.', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80', @id_event_trap
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_trap);

INSERT INTO `comunidades` (`nome`, `descricao`, `imagem`, `id_evento`)
SELECT 'Comunidade: MPB no Parque', 'Grupo para combinar picnic, chegada cedo e melhores lugares no parque.', 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80', @id_event_mpb
WHERE NOT EXISTS (SELECT 1 FROM `comunidades` WHERE `id_evento` = @id_event_mpb);

SET @id_com_neon = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_neon LIMIT 1);
SET @id_com_rock = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_rock LIMIT 1);
SET @id_com_pagode = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_pagode LIMIT 1);
SET @id_com_pop = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_pop LIMIT 1);
SET @id_com_trap = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_trap LIMIT 1);
SET @id_com_mpb = (SELECT `id_comunidade` FROM `comunidades` WHERE `id_evento` = @id_event_mpb LIMIT 1);

SET @id_art_alok = (SELECT `id_artista` FROM `artistas` WHERE `nome` = 'Alok' ORDER BY `id_artista` LIMIT 1);
SET @id_art_vintage = (SELECT `id_artista` FROM `artistas` WHERE `nome` = 'Vintage Culture' ORDER BY `id_artista` LIMIT 1);
SET @id_art_ludmilla = (SELECT `id_artista` FROM `artistas` WHERE `nome` = 'Ludmilla' ORDER BY `id_artista` LIMIT 1);
SET @id_art_matue = (SELECT `id_artista` FROM `artistas` WHERE `nome` IN ('Matue', 'Matuê') ORDER BY `id_artista` LIMIT 1);
SET @id_art_djavan = (SELECT `id_artista` FROM `artistas` WHERE `nome` = 'Djavan' ORDER BY `id_artista` LIMIT 1);
SET @id_art_aurora = (SELECT `id_artista` FROM `artistas` WHERE `nome` = 'Banda Aurora' ORDER BY `id_artista` LIMIT 1);

INSERT IGNORE INTO `line_up` (`id_evento`, `id_artista`) VALUES
(@id_event_neon, @id_art_alok),
(@id_event_neon, @id_art_vintage),
(@id_event_rock, @id_art_aurora),
(@id_event_pagode, @id_art_ludmilla),
(@id_event_pop, @id_art_ludmilla),
(@id_event_trap, @id_art_matue),
(@id_event_mpb, @id_art_djavan);

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 89.90, 240, @id_event_neon
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_neon AND `nome_tipo` = 'Pista');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'VIP', 159.90, 80, @id_event_neon
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_neon AND `nome_tipo` = 'VIP');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 69.90, 180, @id_event_rock
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_rock AND `nome_tipo` = 'Pista');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 74.90, 220, @id_event_pagode
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_pagode AND `nome_tipo` = 'Pista');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 99.90, 200, @id_event_pop
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_pop AND `nome_tipo` = 'Pista');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 84.90, 210, @id_event_trap
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_trap AND `nome_tipo` = 'Pista');

INSERT INTO `tipos_ingressos` (`nome_tipo`, `valor`, `quantidade_disponivel`, `id_evento`)
SELECT 'Pista', 59.90, 160, @id_event_mpb
WHERE NOT EXISTS (SELECT 1 FROM `tipos_ingressos` WHERE `id_evento` = @id_event_mpb AND `nome_tipo` = 'Pista');

SET @id_tipo_neon = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_neon AND `nome_tipo` = 'Pista' LIMIT 1);
SET @id_tipo_rock = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_rock AND `nome_tipo` = 'Pista' LIMIT 1);
SET @id_tipo_pagode = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_pagode AND `nome_tipo` = 'Pista' LIMIT 1);
SET @id_tipo_pop = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_pop AND `nome_tipo` = 'Pista' LIMIT 1);
SET @id_tipo_trap = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_trap AND `nome_tipo` = 'Pista' LIMIT 1);
SET @id_tipo_mpb = (SELECT `id_tipos_ingressos` FROM `tipos_ingressos` WHERE `id_evento` = @id_event_mpb AND `nome_tipo` = 'Pista' LIMIT 1);

DROP TEMPORARY TABLE IF EXISTS `seed_feed_events`;
CREATE TEMPORARY TABLE `seed_feed_events` (
  `id_evento` INT NOT NULL,
  `id_tipo_ingresso` INT NOT NULL,
  `valor` DECIMAL(8,2) NOT NULL,
  `dias_atras` INT NOT NULL
);

INSERT INTO `seed_feed_events` (`id_evento`, `id_tipo_ingresso`, `valor`, `dias_atras`) VALUES
(@id_event_neon, @id_tipo_neon, 89.90, 8),
(@id_event_rock, @id_tipo_rock, 69.90, 7),
(@id_event_pagode, @id_tipo_pagode, 74.90, 6),
(@id_event_pop, @id_tipo_pop, 99.90, 5),
(@id_event_trap, @id_tipo_trap, 84.90, 4),
(@id_event_mpb, @id_tipo_mpb, 59.90, 3);

DROP TEMPORARY TABLE IF EXISTS `seed_feed_ticket_pairs`;
CREATE TEMPORARY TABLE `seed_feed_ticket_pairs` AS
SELECT
  p.`id_participante`,
  sfe.`id_evento`,
  sfe.`id_tipo_ingresso`,
  sfe.`valor`,
  sfe.`dias_atras`
FROM `participantes` p
INNER JOIN `seed_feed_events` sfe
WHERE NOT EXISTS (
  SELECT 1
  FROM `ingressos` i
  WHERE i.`id_participante` = p.`id_participante`
    AND i.`id_evento` = sfe.`id_evento`
);

INSERT INTO `compras` (`id_participante`, `id_evento`, `status`, `valor_total`, `data_compra`)
SELECT
  `id_participante`,
  `id_evento`,
  'confirmada',
  `valor`,
  DATE_SUB(NOW(), INTERVAL `dias_atras` DAY)
FROM `seed_feed_ticket_pairs`;

INSERT IGNORE INTO `compra_itens` (`id_compra`, `id_tipo_ingresso`, `quantidade`, `valor_unitario`, `subtotal`)
SELECT
  c.`id_compra`,
  stp.`id_tipo_ingresso`,
  1,
  stp.`valor`,
  stp.`valor`
FROM `seed_feed_ticket_pairs` stp
INNER JOIN `compras` c
  ON c.`id_compra` = (
    SELECT MAX(c2.`id_compra`)
    FROM `compras` c2
    WHERE c2.`id_participante` = stp.`id_participante`
      AND c2.`id_evento` = stp.`id_evento`
  );

INSERT INTO `ingressos` (`data_compra`, `status`, `id_participante`, `id_evento`, `id_tipo_ingresso`, `id_compra`)
SELECT
  DATE_SUB(CURDATE(), INTERVAL stp.`dias_atras` DAY),
  'ativo',
  stp.`id_participante`,
  stp.`id_evento`,
  stp.`id_tipo_ingresso`,
  c.`id_compra`
FROM `seed_feed_ticket_pairs` stp
INNER JOIN `compras` c
  ON c.`id_compra` = (
    SELECT MAX(c2.`id_compra`)
    FROM `compras` c2
    WHERE c2.`id_participante` = stp.`id_participante`
      AND c2.`id_evento` = stp.`id_evento`
  )
WHERE NOT EXISTS (
  SELECT 1
  FROM `ingressos` i
  WHERE i.`id_participante` = stp.`id_participante`
    AND i.`id_evento` = stp.`id_evento`
);

INSERT IGNORE INTO `participante_comunidades` (`id_participante`, `id_comunidade`)
SELECT p.`id_participante`, c.`id_comunidade`
FROM `participantes` p
INNER JOIN `comunidades` c
  ON c.`id_evento` IN (@id_event_neon, @id_event_rock, @id_event_pagode, @id_event_pop, @id_event_trap, @id_event_mpb);

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?', NULL, 0, @id_autor_local, @id_com_neon, DATE_SUB(NOW(), INTERVAL 1 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Dica para o Neon: cheguem cedo para pegar a pista abrindo e trocar pulseira sem fila.', 'd9149dbd527f54158a07ffbd0e39c4e4.png', 0, @id_ana, @id_com_neon, DATE_SUB(NOW(), INTERVAL 3 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Dica para o Neon: cheguem cedo para pegar a pista abrindo e trocar pulseira sem fila.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Playlist de esquenta pronta. Alok e Vintage Culture no mesmo role vai ser pesado.', NULL, 0, @id_bruno, @id_com_neon, DATE_SUB(NOW(), INTERVAL 5 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Playlist de esquenta pronta. Alok e Vintage Culture no mesmo role vai ser pesado.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'A comunidade do Rock na Estacao ja virou mural de caronas. Tem vaga saindo do centro as 18h.', NULL, 0, @id_camila, @id_com_rock, DATE_SUB(NOW(), INTERVAL 8 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'A comunidade do Rock na Estacao ja virou mural de caronas. Tem vaga saindo do centro as 18h.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Se alguem for de camiseta de banda nacional, quero foto no antes do show.', '7b44f43daa896dcca1f149ea48b45d5f.jpeg', 0, @id_diego, @id_com_rock, DATE_SUB(NOW(), INTERVAL 11 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Se alguem for de camiseta de banda nacional, quero foto no antes do show.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Line-up perfeito para quem gosta de guitarra sem frescura. Estacao Rock prometendo.', NULL, 0, @id_fernanda, @id_com_rock, DATE_SUB(NOW(), INTERVAL 13 HOUR)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Line-up perfeito para quem gosta de guitarra sem frescura. Estacao Rock prometendo.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Pagode do Fim de Semana com roda depois do show? Ja estou separando o grupo.', NULL, 0, @id_mariana, @id_com_pagode, DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Pagode do Fim de Semana com roda depois do show? Ja estou separando o grupo.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'O Pier Maua no por do sol vai render muita foto boa.', '0b87e7d5a3da441f5cb407acb5e6c646.jpg', 0, @id_ana, @id_com_pagode, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 2 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'O Pier Maua no por do sol vai render muita foto boa.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Comprei pista e ja entrei na comunidade. Bora fechar combo de transporte.', NULL, 0, @id_autor_local, @id_com_pagode, DATE_SUB(NOW(), INTERVAL 1 DAY) + INTERVAL 4 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Comprei pista e ja entrei na comunidade. Bora fechar combo de transporte.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Pop Sunset Recife ganhou meu coracao so pela vista do Marco Zero.', NULL, 0, @id_bruno, @id_com_pop, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Pop Sunset Recife ganhou meu coracao so pela vista do Marco Zero.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Quem tambem esta montando look colorido para o Pop Sunset?', '38d2d45d3954c9e8c18fcf5193d52d33.jpg', 0, @id_camila, @id_com_pop, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 3 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Quem tambem esta montando look colorido para o Pop Sunset?');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'A comunidade esta ajudando a montar uma lista de afters perto do evento.', NULL, 0, @id_diego, @id_com_pop, DATE_SUB(NOW(), INTERVAL 2 DAY) + INTERVAL 5 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'A comunidade esta ajudando a montar uma lista de afters perto do evento.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Trap Lab BH com Matue no radar. Quero ver a galera cantando tudo.', NULL, 0, @id_fernanda, @id_com_trap, DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Trap Lab BH com Matue no radar. Quero ver a galera cantando tudo.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Mineirao Hall com bass pesado significa noite longa. Levem documento e cheguem cedo.', '4e740cb472bfb9113bc0d5561b83f303.jpg', 0, @id_mariana, @id_com_trap, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 2 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Mineirao Hall com bass pesado significa noite longa. Levem documento e cheguem cedo.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Ja tem grupo combinando meetup depois da entrada VIP.', NULL, 0, @id_ana, @id_com_trap, DATE_SUB(NOW(), INTERVAL 3 DAY) + INTERVAL 4 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Ja tem grupo combinando meetup depois da entrada VIP.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'MPB no Parque parece o evento perfeito para ir com amigos e ficar de boa.', NULL, 0, @id_autor_local, @id_com_mpb, DATE_SUB(NOW(), INTERVAL 4 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'MPB no Parque parece o evento perfeito para ir com amigos e ficar de boa.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Djavan no clima de fim de tarde vai ser absurdo.', 'bea02d9c32d83533c6e31fd54b4fa4a8.jpg', 0, @id_diego, @id_com_mpb, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 3 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Djavan no clima de fim de tarde vai ser absurdo.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'A comunidade esta trocando dicas de lanche, transporte e melhor entrada do parque.', NULL, 0, @id_camila, @id_com_mpb, DATE_SUB(NOW(), INTERVAL 4 DAY) + INTERVAL 5 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'A comunidade esta trocando dicas de lanche, transporte e melhor entrada do parque.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Quem chegar primeiro manda foto da fila na comunidade. Ajuda geral a se organizar.', NULL, 0, @id_bruno, @id_com_neon, DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Quem chegar primeiro manda foto da fila na comunidade. Ajuda geral a se organizar.');

INSERT INTO `postagens` (`descricao`, `imagem`, `curtidas`, `id_participante`, `id_comunidade`, `data_postagem`)
SELECT 'Curti a revenda segura do JoinUp. Bom ter tudo no mesmo painel antes do show.', NULL, 0, @id_fernanda, @id_com_rock, DATE_SUB(NOW(), INTERVAL 5 DAY) + INTERVAL 3 HOUR
WHERE NOT EXISTS (SELECT 1 FROM `postagens` WHERE `descricao` = 'Curti a revenda segura do JoinUp. Bom ter tudo no mesmo painel antes do show.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Estou no grupo das 20h. Podemos marcar perto da entrada principal.', p.`id_postagem`, @id_ana, DATE_ADD(p.`data_postagem`, INTERVAL 18 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Estou no grupo das 20h. Podemos marcar perto da entrada principal.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Boa! Vou salvar esse ponto de encontro tambem.', p.`id_postagem`, @id_bruno, DATE_ADD(p.`data_postagem`, INTERVAL 34 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Boa! Vou salvar esse ponto de encontro tambem.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Chegar cedo vai salvar demais. Ano passado a fila ficou enorme.', p.`id_postagem`, @id_camila, DATE_ADD(p.`data_postagem`, INTERVAL 22 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Dica para o Neon: cheguem cedo para pegar a pista abrindo e trocar pulseira sem fila.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Chegar cedo vai salvar demais. Ano passado a fila ficou enorme.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Tenho duas vagas saindo do centro, me chama na comunidade.', p.`id_postagem`, @id_diego, DATE_ADD(p.`data_postagem`, INTERVAL 25 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'A comunidade do Rock na Estacao ja virou mural de caronas. Tem vaga saindo do centro as 18h.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Tenho duas vagas saindo do centro, me chama na comunidade.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Fechado, vou levar minha camiseta do show antigo.', p.`id_postagem`, @id_fernanda, DATE_ADD(p.`data_postagem`, INTERVAL 30 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Se alguem for de camiseta de banda nacional, quero foto no antes do show.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Fechado, vou levar minha camiseta do show antigo.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Depois do show tem roda sim, ja combinei com uma parte do grupo.', p.`id_postagem`, @id_ana, DATE_ADD(p.`data_postagem`, INTERVAL 19 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Pagode do Fim de Semana com roda depois do show? Ja estou separando o grupo.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Depois do show tem roda sim, ja combinei com uma parte do grupo.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Marco Zero combina demais com esse evento.', p.`id_postagem`, @id_mariana, DATE_ADD(p.`data_postagem`, INTERVAL 37 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Pop Sunset Recife ganhou meu coracao so pela vista do Marco Zero.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Marco Zero combina demais com esse evento.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Estou separando uma jaqueta neon. Vai aparecer bem nas fotos.', p.`id_postagem`, @id_bruno, DATE_ADD(p.`data_postagem`, INTERVAL 42 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Quem tambem esta montando look colorido para o Pop Sunset?'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Estou separando uma jaqueta neon. Vai aparecer bem nas fotos.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Esse vai ser daqueles que ninguem fica parado.', p.`id_postagem`, @id_diego, DATE_ADD(p.`data_postagem`, INTERVAL 28 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Trap Lab BH com Matue no radar. Quero ver a galera cantando tudo.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Esse vai ser daqueles que ninguem fica parado.');

INSERT INTO `comentarios` (`texto`, `id_postagem`, `id_participante`, `data_comentario`)
SELECT 'Vou chegar cedo para pegar lugar perto do palco.', p.`id_postagem`, @id_camila, DATE_ADD(p.`data_postagem`, INTERVAL 31 MINUTE)
FROM `postagens` p
WHERE p.`descricao` = 'Djavan no clima de fim de tarde vai ser absurdo.'
  AND NOT EXISTS (SELECT 1 FROM `comentarios` c WHERE c.`id_postagem` = p.`id_postagem` AND c.`texto` = 'Vou chegar cedo para pegar lugar perto do palco.');

INSERT IGNORE INTO `postagem_curtidas` (`id_participante`, `id_postagem`)
SELECT liker.`id_participante`, post.`id_postagem`
FROM `participantes` liker
INNER JOIN `postagens` post
  ON post.`descricao` IN (
    'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?',
    'Dica para o Neon: cheguem cedo para pegar a pista abrindo e trocar pulseira sem fila.',
    'Playlist de esquenta pronta. Alok e Vintage Culture no mesmo role vai ser pesado.',
    'A comunidade do Rock na Estacao ja virou mural de caronas. Tem vaga saindo do centro as 18h.',
    'Se alguem for de camiseta de banda nacional, quero foto no antes do show.',
    'Line-up perfeito para quem gosta de guitarra sem frescura. Estacao Rock prometendo.',
    'Pagode do Fim de Semana com roda depois do show? Ja estou separando o grupo.',
    'O Pier Maua no por do sol vai render muita foto boa.',
    'Comprei pista e ja entrei na comunidade. Bora fechar combo de transporte.',
    'Pop Sunset Recife ganhou meu coracao so pela vista do Marco Zero.',
    'Quem tambem esta montando look colorido para o Pop Sunset?',
    'A comunidade esta ajudando a montar uma lista de afters perto do evento.',
    'Trap Lab BH com Matue no radar. Quero ver a galera cantando tudo.',
    'Mineirao Hall com bass pesado significa noite longa. Levem documento e cheguem cedo.',
    'Ja tem grupo combinando meetup depois da entrada VIP.',
    'MPB no Parque parece o evento perfeito para ir com amigos e ficar de boa.',
    'Djavan no clima de fim de tarde vai ser absurdo.',
    'A comunidade esta trocando dicas de lanche, transporte e melhor entrada do parque.',
    'Quem chegar primeiro manda foto da fila na comunidade. Ajuda geral a se organizar.',
    'Curti a revenda segura do JoinUp. Bom ter tudo no mesmo painel antes do show.'
  )
WHERE liker.`id_participante` <> post.`id_participante`
  AND liker.`email` IN (
    'ana.ribeiro@joinup.local',
    'bruno.lima@joinup.local',
    'camila.torres@joinup.local',
    'diego.souza@joinup.local',
    'fernanda.rocha@joinup.local',
    'mariana.prado@joinup.local',
    'kmoraes360@gmail.com'
  );

UPDATE `postagens` p
SET p.`curtidas` = (
  SELECT COUNT(*)
  FROM `postagem_curtidas` pc
  WHERE pc.`id_postagem` = p.`id_postagem`
)
WHERE p.`descricao` IN (
  'Entrei na comunidade do Festival Neon JoinUp. Quem ja esta combinando ponto de encontro?',
  'Dica para o Neon: cheguem cedo para pegar a pista abrindo e trocar pulseira sem fila.',
  'Playlist de esquenta pronta. Alok e Vintage Culture no mesmo role vai ser pesado.',
  'A comunidade do Rock na Estacao ja virou mural de caronas. Tem vaga saindo do centro as 18h.',
  'Se alguem for de camiseta de banda nacional, quero foto no antes do show.',
  'Line-up perfeito para quem gosta de guitarra sem frescura. Estacao Rock prometendo.',
  'Pagode do Fim de Semana com roda depois do show? Ja estou separando o grupo.',
  'O Pier Maua no por do sol vai render muita foto boa.',
  'Comprei pista e ja entrei na comunidade. Bora fechar combo de transporte.',
  'Pop Sunset Recife ganhou meu coracao so pela vista do Marco Zero.',
  'Quem tambem esta montando look colorido para o Pop Sunset?',
  'A comunidade esta ajudando a montar uma lista de afters perto do evento.',
  'Trap Lab BH com Matue no radar. Quero ver a galera cantando tudo.',
  'Mineirao Hall com bass pesado significa noite longa. Levem documento e cheguem cedo.',
  'Ja tem grupo combinando meetup depois da entrada VIP.',
  'MPB no Parque parece o evento perfeito para ir com amigos e ficar de boa.',
  'Djavan no clima de fim de tarde vai ser absurdo.',
  'A comunidade esta trocando dicas de lanche, transporte e melhor entrada do parque.',
  'Quem chegar primeiro manda foto da fila na comunidade. Ajuda geral a se organizar.',
  'Curti a revenda segura do JoinUp. Bom ter tudo no mesmo painel antes do show.'
);

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_neon, 'organizador', NULL, @id_org_joinup, 'Bem-vindos ao Festival Neon JoinUp. Usem este espaco para combinar chegada e tirar duvidas.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_neon AND `mensagem` = 'Bem-vindos ao Festival Neon JoinUp. Usem este espaco para combinar chegada e tirar duvidas.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_neon, 'participante', @id_ana, NULL, 'Vou chegar por volta das 19h30. Quem topar, marcamos perto da bilheteria.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_neon AND `mensagem` = 'Vou chegar por volta das 19h30. Quem topar, marcamos perto da bilheteria.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_rock, 'organizador', NULL, @id_org_joinup, 'Rock na Estacao tera entrada liberada a partir das 18h. Levem documento com foto.', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_rock AND `mensagem` = 'Rock na Estacao tera entrada liberada a partir das 18h. Levem documento com foto.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_pagode, 'participante', @id_mariana, NULL, 'Quem for de transporte por app pode fechar ida compartilhada aqui.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_pagode AND `mensagem` = 'Quem for de transporte por app pode fechar ida compartilhada aqui.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_pop, 'participante', @id_camila, NULL, 'Criei uma lista de ideias de look colorido. Mandem referencias por aqui.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_pop AND `mensagem` = 'Criei uma lista de ideias de look colorido. Mandem referencias por aqui.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_trap, 'organizador', NULL, @id_org_joinup, 'Trap Lab BH tera lockers limitados. Cheguem cedo se forem levar mochila.', NULL, DATE_SUB(NOW(), INTERVAL 2 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_trap AND `mensagem` = 'Trap Lab BH tera lockers limitados. Cheguem cedo se forem levar mochila.');

INSERT INTO `comunidade_mensagens` (`id_comunidade`, `autor_tipo`, `id_participante`, `id_organizador`, `mensagem`, `imagem`, `data_envio`)
SELECT @id_com_mpb, 'participante', @id_diego, NULL, 'Vou levar canga e chegar cedo para guardar um lugar bom perto do palco.', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `comunidade_mensagens` WHERE `id_comunidade` = @id_com_mpb AND `mensagem` = 'Vou levar canga e chegar cedo para guardar um lugar bom perto do palco.');

SET @id_ingresso_revenda_neon = (
  SELECT `id_ingresso`
  FROM `ingressos`
  WHERE `id_participante` = @id_bruno
    AND `id_evento` = @id_event_neon
  ORDER BY `id_ingresso`
  LIMIT 1
);

SET @id_ingresso_revenda_rock = (
  SELECT `id_ingresso`
  FROM `ingressos`
  WHERE `id_participante` = @id_fernanda
    AND `id_evento` = @id_event_rock
  ORDER BY `id_ingresso`
  LIMIT 1
);

INSERT INTO `revenda_anuncios` (`valor_revenda`, `status`, `id_ingresso`, `id_participante`)
SELECT 78.00, 'disponivel', @id_ingresso_revenda_neon, @id_bruno
WHERE @id_ingresso_revenda_neon IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `revenda_anuncios` WHERE `id_ingresso` = @id_ingresso_revenda_neon);

INSERT INTO `revenda_anuncios` (`valor_revenda`, `status`, `id_ingresso`, `id_participante`)
SELECT 62.00, 'disponivel', @id_ingresso_revenda_rock, @id_fernanda
WHERE @id_ingresso_revenda_rock IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM `revenda_anuncios` WHERE `id_ingresso` = @id_ingresso_revenda_rock);

DROP TEMPORARY TABLE IF EXISTS `seed_feed_ticket_pairs`;
DROP TEMPORARY TABLE IF EXISTS `seed_feed_events`;

COMMIT;

SELECT
  (SELECT COUNT(*) FROM `eventos`) AS total_eventos,
  (SELECT COUNT(*) FROM `comunidades`) AS total_comunidades,
  (SELECT COUNT(*) FROM `postagens`) AS total_postagens,
  (SELECT COUNT(*) FROM `comentarios`) AS total_comentarios,
  (SELECT COUNT(*) FROM `postagem_curtidas`) AS total_curtidas,
  (SELECT COUNT(*) FROM `comunidade_mensagens`) AS total_mensagens_comunidade,
  (SELECT COUNT(*) FROM `ingressos`) AS total_ingressos;
