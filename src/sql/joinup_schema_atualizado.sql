SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP SCHEMA IF EXISTS `joinup`;
CREATE SCHEMA IF NOT EXISTS `joinup` DEFAULT CHARACTER SET utf8;
USE `joinup`;

CREATE TABLE IF NOT EXISTS `artistas` (
  `id_artista` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  `cpf` CHAR(11) NULL,
  PRIMARY KEY (`id_artista`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `organizadores` (
  `id_organizador` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  `email` VARCHAR(40) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  `cnpj` CHAR(18) NOT NULL,
  UNIQUE INDEX (`email` ASC),
  UNIQUE INDEX (`cnpj` ASC),
  PRIMARY KEY (`id_organizador`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `generos_musicais` (
  `id_genero_musical` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`id_genero_musical`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `eventos` (
  `id_evento` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(45) NOT NULL,
  `data` DATETIME NOT NULL,
  `descricao` VARCHAR(450) NOT NULL,
  `imagem` VARCHAR(255) NULL DEFAULT NULL,
  `localizacao` VARCHAR(45) NOT NULL,
  `cidade` VARCHAR(60) NOT NULL,
  `estado` ENUM('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') NOT NULL,
  `cep` VARCHAR(8) NOT NULL,
  `id_organizador` INT NOT NULL,
  `id_genero_musical` INT NOT NULL,
  PRIMARY KEY (`id_evento`),
  UNIQUE INDEX `uk_id_evento` (`id_evento` ASC),
  INDEX `fk_eventos_generos_musicais1_idx` (`id_genero_musical` ASC),
  INDEX `fk_eventos_organizadores1_idx` (`id_organizador` ASC),
  CONSTRAINT `fk_eventos_generos_musicais1`
    FOREIGN KEY (`id_genero_musical`)
    REFERENCES `generos_musicais` (`id_genero_musical`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_eventos_organizadores1`
    FOREIGN KEY (`id_organizador`)
    REFERENCES `organizadores` (`id_organizador`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `participantes` (
  `id_participante` INT NOT NULL AUTO_INCREMENT,
  `cpf` CHAR(11) NOT NULL,
  `nome` VARCHAR(60) NOT NULL,
  `data_nascimento` CHAR(14) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  UNIQUE INDEX (`email` ASC),
  UNIQUE INDEX `cpf_UNIQUE` (`cpf` ASC),
  PRIMARY KEY (`id_participante`)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `comunidades` (
  `id_comunidade` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  `descricao` VARCHAR(300) NULL DEFAULT NULL,
  `imagem` VARCHAR(255) NULL DEFAULT NULL,
  `id_evento` INT NOT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_comunidade`),
  UNIQUE INDEX `uk_comunidade_evento` (`id_evento` ASC),
  CONSTRAINT `fk_comunidades_eventos`
    FOREIGN KEY (`id_evento`)
    REFERENCES `eventos` (`id_evento`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `participante_comunidades` (
  `id_participante` INT NOT NULL,
  `id_comunidade` INT NOT NULL,
  `data_entrada` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_participante`, `id_comunidade`),
  INDEX `fk_pc_comunidade_idx` (`id_comunidade` ASC),
  INDEX `fk_pc_participante_idx` (`id_participante` ASC),
  CONSTRAINT `fk_pc_participante`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_pc_comunidade`
    FOREIGN KEY (`id_comunidade`)
    REFERENCES `comunidades` (`id_comunidade`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `comunidade_mensagens` (
  `id_mensagem` INT NOT NULL AUTO_INCREMENT,
  `id_comunidade` INT NOT NULL,
  `autor_tipo` ENUM('participante', 'organizador') NOT NULL,
  `id_participante` INT NULL,
  `id_organizador` INT NULL,
  `mensagem` VARCHAR(1000) NOT NULL,
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

CREATE TABLE IF NOT EXISTS `postagens` (
  `id_postagem` INT NOT NULL AUTO_INCREMENT,
  `descricao` VARCHAR(500) NULL DEFAULT NULL,
  `imagem` VARCHAR(255) NULL DEFAULT NULL,
  `curtidas` INT NULL DEFAULT 0,
  `id_participante` INT NOT NULL,
  `id_comunidade` INT NOT NULL,
  `data_postagem` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_postagem`),
  INDEX `fk_postagem_participantes1_idx` (`id_participante` ASC),
  INDEX `fk_postagens_comunidades_idx` (`id_comunidade` ASC),
  CONSTRAINT `fk_postagem_participantes1`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_postagens_comunidades`
    FOREIGN KEY (`id_comunidade`)
    REFERENCES `comunidades` (`id_comunidade`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `comentarios` (
  `id_comentario` INT NOT NULL AUTO_INCREMENT,
  `texto` VARCHAR(500) NOT NULL,
  `id_postagem` INT NOT NULL,
  `id_participante` INT NOT NULL,
  `data_comentario` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_comentario`),
  INDEX `fk_comentarios_postagens1_idx` (`id_postagem` ASC),
  INDEX `fk_comentarios_participantes_idx` (`id_participante` ASC),
  CONSTRAINT `fk_comentarios_postagens1`
    FOREIGN KEY (`id_postagem`)
    REFERENCES `postagens` (`id_postagem`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_comentarios_participantes`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `tipos_ingressos` (
  `id_tipos_ingressos` INT NOT NULL AUTO_INCREMENT,
  `nome_tipo` VARCHAR(45) NOT NULL,
  `valor` DECIMAL(8,2) NOT NULL,
  `quantidade_disponivel` INT NOT NULL,
  `id_evento` INT NOT NULL,
  PRIMARY KEY (`id_tipos_ingressos`),
  INDEX `fk_tipos_ingressos_eventos1_idx` (`id_evento` ASC),
  CONSTRAINT `fk_tipos_ingressos_eventos1`
    FOREIGN KEY (`id_evento`)
    REFERENCES `eventos` (`id_evento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `compras` (
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
    REFERENCES `participantes` (`id_participante`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_compras_eventos`
    FOREIGN KEY (`id_evento`)
    REFERENCES `eventos` (`id_evento`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `compra_itens` (
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
    REFERENCES `compras` (`id_compra`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_compra_itens_tipos_ingressos`
    FOREIGN KEY (`id_tipo_ingresso`)
    REFERENCES `tipos_ingressos` (`id_tipos_ingressos`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `ingressos` (
  `id_ingresso` INT NOT NULL AUTO_INCREMENT,
  `data_compra` DATE NOT NULL,
  `status` ENUM('ativo', 'cancelado', 'utilizado') NOT NULL,
  `id_participante` INT NOT NULL,
  `id_evento` INT NOT NULL,
  `id_tipo_ingresso` INT NOT NULL,
  `id_compra` INT NOT NULL,
  PRIMARY KEY (`id_ingresso`),
  INDEX `fk_ingressos_participantes_idx` (`id_participante` ASC),
  INDEX `fk_ingressos_eventos1_idx` (`id_evento` ASC),
  INDEX `fk_ingressos_tipos_ingressos1_idx` (`id_tipo_ingresso` ASC),
  INDEX `fk_ingressos_compras_idx` (`id_compra` ASC),
  CONSTRAINT `fk_ingressos_participantes`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ingressos_eventos1`
    FOREIGN KEY (`id_evento`)
    REFERENCES `eventos` (`id_evento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ingressos_tipos_ingressos1`
    FOREIGN KEY (`id_tipo_ingresso`)
    REFERENCES `tipos_ingressos` (`id_tipos_ingressos`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ingressos_compras`
    FOREIGN KEY (`id_compra`)
    REFERENCES `compras` (`id_compra`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `line_up` (
  `id_evento` INT NOT NULL,
  `id_artista` INT NOT NULL,
  PRIMARY KEY (`id_evento`, `id_artista`),
  INDEX `fk_eventos_has_artistas_artistas1_idx` (`id_artista` ASC),
  INDEX `fk_eventos_has_artistas_eventos1_idx` (`id_evento` ASC),
  CONSTRAINT `fk_eventos_has_artistas_eventos1`
    FOREIGN KEY (`id_evento`)
    REFERENCES `eventos` (`id_evento`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_eventos_has_artistas_artistas1`
    FOREIGN KEY (`id_artista`)
    REFERENCES `artistas` (`id_artista`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `revenda_anuncios` (
  `id_revenda_anuncios` INT NOT NULL AUTO_INCREMENT,
  `valor_revenda` DECIMAL(8,2) NOT NULL,
  `status` ENUM('disponivel', 'vendido', 'cancelado') NOT NULL,
  `id_ingresso` INT NOT NULL,
  `id_participante` INT NOT NULL,
  PRIMARY KEY (`id_revenda_anuncios`),
  INDEX `fk_revenda_anuncios_ingressos1_idx` (`id_ingresso` ASC),
  INDEX `fk_revenda_anuncios_participantes1_idx` (`id_participante` ASC),
  UNIQUE INDEX `id_ingresso_UNIQUE` (`id_ingresso` ASC),
  CONSTRAINT `fk_revenda_anuncios_ingressos1`
    FOREIGN KEY (`id_ingresso`)
    REFERENCES `ingressos` (`id_ingresso`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_revenda_anuncios_participantes1`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `usuarios_suporte` (
  `id_usuario_suporte` INT NOT NULL AUTO_INCREMENT,
  `nome` VARCHAR(80) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `senha` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id_usuario_suporte`),
  UNIQUE INDEX `uk_usuarios_suporte_email` (`email` ASC)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS `ticket` (
  `id_ticket` INT NOT NULL AUTO_INCREMENT,
  `titulo` VARCHAR(100) NULL,
  `descricao` VARCHAR(500) NULL,
  `resposta` VARCHAR(500) NULL DEFAULT NULL,
  `atendido` TINYINT(1) NOT NULL DEFAULT 0,
  `status_ticket` ENUM('aberto', 'em_atendimento', 'aguardando_usuario', 'fechado') NOT NULL DEFAULT 'aberto',
  `retorno_usuario` VARCHAR(500) NULL DEFAULT NULL,
  `id_participante` INT NULL,
  `id_usuario_suporte` INT NULL,
  `id_organizador` INT NULL,
  `data_criacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `data_atualizacao` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `data_fechamento` DATETIME NULL DEFAULT NULL,
  PRIMARY KEY (`id_ticket`),
  INDEX `fk_ticket_participantes1_idx` (`id_participante` ASC),
  INDEX `fk_ticket_usuarios_suporte1_idx` (`id_usuario_suporte` ASC),
  INDEX `fk_ticket_organizadores1_idx` (`id_organizador` ASC),
  INDEX `idx_ticket_status` (`status_ticket` ASC),
  INDEX `idx_ticket_data_criacao` (`data_criacao` ASC),
  CONSTRAINT `fk_ticket_participantes1`
    FOREIGN KEY (`id_participante`)
    REFERENCES `participantes` (`id_participante`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ticket_usuarios_suporte1`
    FOREIGN KEY (`id_usuario_suporte`)
    REFERENCES `usuarios_suporte` (`id_usuario_suporte`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_ticket_organizadores1`
    FOREIGN KEY (`id_organizador`)
    REFERENCES `organizadores` (`id_organizador`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
) ENGINE = InnoDB;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

INSERT INTO `generos_musicais` (`nome`) VALUES 
('Sertanejo'), ('Pop'), ('Funk'), ('Rock'), ('Eletrônica'), 
('Pagode'), ('Samba'), ('MPB'), ('Trap'), ('Rap'), 
('Forró'), ('Axé'), ('Indie'), ('Gospel'), ('Reggae');

INSERT INTO `artistas` (`nome`, `cpf`) VALUES 
('Ana Castela', '11122233344'), 
('Alok', '22233344455'), 
('Ludmilla', '33344455566'), 
('Jorge & Mateus', '44455566677'), 
('Matuê', '55566677788'), 
('Péricles', '66677788899'), 
('Luísa Sonza', '77788899900'), 
('Djavan', '88899900011'), 
('Ivete Sangalo', '99900011122'), 
('Vintage Culture', '00011122233');
