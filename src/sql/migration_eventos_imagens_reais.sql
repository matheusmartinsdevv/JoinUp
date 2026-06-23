-- Troca as imagens dos eventos de exemplo por URLs de fotos reais de eventos.
-- Pode executar novamente sem duplicar dados.

USE `joinup`;

START TRANSACTION;

UPDATE `eventos`
SET `imagem` = CASE `nome`
  WHEN 'Festival Neon JoinUp' THEN 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Rock na Estacao' THEN 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Pagode do Fim de Semana' THEN 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Pop Sunset Recife' THEN 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1200&q=80'
  WHEN 'Trap Lab BH' THEN 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'
  WHEN 'MPB no Parque' THEN 'https://images.unsplash.com/photo-1507874457470-272b3c8d8ee2?auto=format&fit=crop&w=1200&q=80'
  ELSE `imagem`
END
WHERE `nome` IN (
  'Festival Neon JoinUp',
  'Rock na Estacao',
  'Pagode do Fim de Semana',
  'Pop Sunset Recife',
  'Trap Lab BH',
  'MPB no Parque'
);

UPDATE `comunidades` c
INNER JOIN `eventos` e ON e.`id_evento` = c.`id_evento`
SET c.`imagem` = e.`imagem`
WHERE e.`nome` IN (
  'Festival Neon JoinUp',
  'Rock na Estacao',
  'Pagode do Fim de Semana',
  'Pop Sunset Recife',
  'Trap Lab BH',
  'MPB no Parque'
);

COMMIT;

SELECT `nome`, `imagem`
FROM `eventos`
WHERE `nome` IN (
  'Festival Neon JoinUp',
  'Rock na Estacao',
  'Pagode do Fim de Semana',
  'Pop Sunset Recife',
  'Trap Lab BH',
  'MPB no Parque'
)
ORDER BY `data`;
