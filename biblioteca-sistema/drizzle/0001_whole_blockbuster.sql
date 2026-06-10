CREATE TABLE `categorias` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categorias_id` PRIMARY KEY(`id`),
	CONSTRAINT `categorias_nome_unique` UNIQUE(`nome`)
);
--> statement-breakpoint
CREATE TABLE `emprestimos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`livro_id` int NOT NULL,
	`data_emprestimo` timestamp NOT NULL DEFAULT (now()),
	`data_devolucao_prevista` date NOT NULL,
	`data_devolucao_real` date,
	`status` enum('ativo','devolvido','atrasado') NOT NULL DEFAULT 'ativo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emprestimos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `livros` (
	`id` int AUTO_INCREMENT NOT NULL,
	`titulo` varchar(255) NOT NULL,
	`autor` varchar(255) NOT NULL,
	`isbn` varchar(20),
	`categoria_id` int NOT NULL,
	`descricao` text,
	`total_copias` int NOT NULL DEFAULT 1,
	`copias_disponiveis` int NOT NULL DEFAULT 1,
	`capa_url` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `livros_id` PRIMARY KEY(`id`),
	CONSTRAINT `livros_isbn_unique` UNIQUE(`isbn`)
);
--> statement-breakpoint
CREATE TABLE `logs_sistema` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int,
	`acao` varchar(100) NOT NULL,
	`descricao` text,
	`tabela_afetada` varchar(100),
	`registro_id` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logs_sistema_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `multas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emprestimo_id` int NOT NULL,
	`usuario_id` int NOT NULL,
	`valor` decimal(10,2) NOT NULL,
	`data_geracao` timestamp NOT NULL DEFAULT (now()),
	`data_pagamento` timestamp,
	`status` enum('pendente','paga') NOT NULL DEFAULT 'pendente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `multas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `preferencias_usuario` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`categorias_preferidas` json,
	`ultimas_recomendacoes` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `preferencias_usuario_id` PRIMARY KEY(`id`),
	CONSTRAINT `preferencias_usuario_usuario_id_unique` UNIQUE(`usuario_id`)
);
--> statement-breakpoint
CREATE TABLE `reservas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`usuario_id` int NOT NULL,
	`livro_id` int NOT NULL,
	`data_reserva` timestamp NOT NULL DEFAULT (now()),
	`data_cancelamento` timestamp,
	`status` enum('ativa','cancelada','concluida') NOT NULL DEFAULT 'ativa',
	`posicao_fila` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('admin','bibliotecario','leitor') NOT NULL DEFAULT 'leitor';--> statement-breakpoint
ALTER TABLE `users` ADD `telefone` varchar(20);--> statement-breakpoint
ALTER TABLE `users` ADD `endereco` text;--> statement-breakpoint
ALTER TABLE `users` ADD `ativo` boolean DEFAULT true NOT NULL;