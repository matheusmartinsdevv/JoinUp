-- Estrutura de compras de ingressos
-- Execute este script uma vez no schema `joinup`.

USE `joinup`;

START TRANSACTION;

-- Cabecalho da compra (pedido)
CREATE TABLE IF NOT EXISTS `joinup`.`compras` (
  `id_compra` INT NOT NULL AUTO_INCREMENT,
  `id_participante` INT NOT NULL,
  `id_evento` INT NOT NULL,
  `status` ENUM('pendente', 'confirmada', 'cancelada') NOT NULL DEFAULT 'confirmada',
  `valor_total` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `data_compra` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_compra`),
  INDEX `idx_compras_participante` (`id_participante` ASC),
  INDEX `idx_compras_evento` (`id_evento` ASC),
  CONSTRAINT `fk_compras_participantes`
    FOREIGN KEY (`id_participante`)
    REFERENCES `joinup`.`participantes` (`id_participante`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_compras_eventos`
    FOREIGN KEY (`id_evento`)
    REFERENCES `joinup`.`eventos` (`id_evento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Itens da compra (um ou mais tipos de ingresso por compra)
CREATE TABLE IF NOT EXISTS `joinup`.`compra_itens` (
  `id_compra_item` INT NOT NULL AUTO_INCREMENT,
  `id_compra` INT NOT NULL,
  `id_tipo_ingresso` INT NOT NULL,
  `quantidade` INT NOT NULL,
  `valor_unitario` DECIMAL(8,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_compra_item`),
  UNIQUE INDEX `uk_compra_tipo` (`id_compra` ASC, `id_tipo_ingresso` ASC),
  INDEX `idx_compra_itens_compra` (`id_compra` ASC),
  INDEX `idx_compra_itens_tipo` (`id_tipo_ingresso` ASC),
  CONSTRAINT `fk_compra_itens_compras`
    FOREIGN KEY (`id_compra`)
    REFERENCES `joinup`.`compras` (`id_compra`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_compra_itens_tipos_ingressos`
    FOREIGN KEY (`id_tipo_ingresso`)
    REFERENCES `joinup`.`tipos_ingressos` (`id_tipos_ingressos`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

-- Vinculo opcional de rastreabilidade entre ingresso emitido e compra
-- Mantem NULL para ingressos antigos ja existentes no banco.
ALTER TABLE `joinup`.`ingressos`
  ADD COLUMN `id_compra` INT NULL AFTER `id_tipo_ingresso`,
  ADD INDEX `idx_ingressos_compra` (`id_compra` ASC),
  ADD CONSTRAINT `fk_ingressos_compras`
    FOREIGN KEY (`id_compra`)
    REFERENCES `joinup`.`compras` (`id_compra`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

COMMIT;
