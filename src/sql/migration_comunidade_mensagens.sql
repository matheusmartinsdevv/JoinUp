-- Estrutura para o feed da comunidade sem lógica de curtida
-- Execute este script uma vez no schema `joinup` para criar a tabela de mensagens da comunidade.

USE `joinup`;

START TRANSACTION;

CREATE TABLE IF NOT EXISTS `comunidade_mensagens` (
  `id_mensagem` INT NOT NULL AUTO_INCREMENT,
  `id_comunidade` INT NOT NULL,
  `autor_tipo` ENUM('participante', 'organizador') NOT NULL,
  `id_participante` INT NULL,
  `id_organizador` INT NULL,
  `mensagem` VARCHAR(1000) NULL DEFAULT NULL,
  `imagem` VARCHAR(255) NULL DEFAULT NULL,
  `id_resposta_a` INT NULL,
  `data_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_mensagem`),
  INDEX `fk_comunidade_mensagens_comunidades1_idx` (`id_comunidade` ASC),
  INDEX `fk_comunidade_mensagens_participantes1_idx` (`id_participante` ASC),
  INDEX `fk_comunidade_mensagens_organizadores1_idx` (`id_organizador` ASC),
  INDEX `fk_comunidade_mensagens_comunidade_mensagens1_idx` (`id_resposta_a` ASC),
  CONSTRAINT `fk_comunidade_mensagens_comunidades1`
    FOREIGN KEY (`id_comunidade`)
    REFERENCES `comunidades` (`id_comunidade`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comunidade_mensagens_participantes1`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comunidade_mensagens_organizadores1`
    FOREIGN KEY (`id_organizador`)
    REFERENCES `organizadores` (`id_organizador`)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comunidade_mensagens_comunidade_mensagens1`
    FOREIGN KEY (`id_resposta_a`)
    REFERENCES `comunidade_mensagens` (`id_mensagem`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE = InnoDB;

COMMIT;
