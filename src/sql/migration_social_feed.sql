-- Recursos sociais do feed JoinUp.
-- Execute uma vez no schema `joinup` se estiver atualizando uma base existente.

USE `joinup`;

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

COMMIT;
