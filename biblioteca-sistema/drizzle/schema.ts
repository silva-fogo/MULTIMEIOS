import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, date, json } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extended with biblioteca-specific fields and role management.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  role: mysqlEnum("role", ["admin", "bibliotecario", "leitor"]).default("leitor").notNull(),
  telefone: varchar("telefone", { length: 20 }),
  endereco: text("endereco"),
  ativo: boolean("ativo").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Categorias de livros
 */
export const categorias = mysqlTable("categorias", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 100 }).notNull().unique(),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Categoria = typeof categorias.$inferSelect;
export type InsertCategoria = typeof categorias.$inferInsert;

/**
 * Tabela de livros
 */
export const livros = mysqlTable("livros", {
  id: int("id").autoincrement().primaryKey(),
  titulo: varchar("titulo", { length: 255 }).notNull(),
  autor: varchar("autor", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 20 }).unique(),
  categoriaId: int("categoria_id").notNull(),
  descricao: text("descricao"),
  totalCopias: int("total_copias").default(1).notNull(),
  copiasDisponiveis: int("copias_disponiveis").default(1).notNull(),
  capaUrl: varchar("capa_url", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Livro = typeof livros.$inferSelect;
export type InsertLivro = typeof livros.$inferInsert;

/**
 * Tabela de empréstimos
 */
export const emprestimos = mysqlTable("emprestimos", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  livroId: int("livro_id").notNull(),
  dataEmprestimo: timestamp("data_emprestimo").defaultNow().notNull(),
  dataDevolucaoPrevista: date("data_devolucao_prevista").notNull(),
  dataDevolucaoReal: date("data_devolucao_real"),
  status: mysqlEnum("status", ["ativo", "devolvido", "atrasado"]).default("ativo").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Emprestimo = typeof emprestimos.$inferSelect;
export type InsertEmprestimo = typeof emprestimos.$inferInsert;

/**
 * Tabela de reservas
 */
export const reservas = mysqlTable("reservas", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull(),
  livroId: int("livro_id").notNull(),
  dataReserva: timestamp("data_reserva").defaultNow().notNull(),
  dataCancelamento: timestamp("data_cancelamento"),
  status: mysqlEnum("status", ["ativa", "cancelada", "concluida"]).default("ativa").notNull(),
  posicaoFila: int("posicao_fila").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reserva = typeof reservas.$inferSelect;
export type InsertReserva = typeof reservas.$inferInsert;

/**
 * Tabela de multas por atraso
 */
export const multas = mysqlTable("multas", {
  id: int("id").autoincrement().primaryKey(),
  emprestimoId: int("emprestimo_id").notNull(),
  usuarioId: int("usuario_id").notNull(),
  valor: decimal("valor", { precision: 10, scale: 2 }).notNull(),
  dataGeracao: timestamp("data_geracao").defaultNow().notNull(),
  dataPagamento: timestamp("data_pagamento"),
  status: mysqlEnum("status", ["pendente", "paga"]).default("pendente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Multa = typeof multas.$inferSelect;
export type InsertMulta = typeof multas.$inferInsert;

/**
 * Tabela de logs de atividades do sistema
 */
export const logsSistema = mysqlTable("logs_sistema", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id"),
  acao: varchar("acao", { length: 100 }).notNull(),
  descricao: text("descricao"),
  tabelaAfetada: varchar("tabela_afetada", { length: 100 }),
  registroId: int("registro_id"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LogSistema = typeof logsSistema.$inferSelect;
export type InsertLogSistema = typeof logsSistema.$inferInsert;

/**
 * Tabela de preferências de usuário para recomendações
 */
export const preferenciasUsuario = mysqlTable("preferencias_usuario", {
  id: int("id").autoincrement().primaryKey(),
  usuarioId: int("usuario_id").notNull().unique(),
  categoriasPreferidas: json("categorias_preferidas"),
  ultimasRecomendacoes: json("ultimas_recomendacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PreferenciaUsuario = typeof preferenciasUsuario.$inferSelect;
export type InsertPreferenciaUsuario = typeof preferenciasUsuario.$inferInsert;

/**
 * Relações entre tabelas
 */
export const usuariosRelations = relations(users, ({ many }) => ({
  emprestimos: many(emprestimos),
  reservas: many(reservas),
  multas: many(multas),
  logs: many(logsSistema),
  preferencias: many(preferenciasUsuario),
}));

export const categoriasRelations = relations(categorias, ({ many }) => ({
  livros: many(livros),
}));

export const livrosRelations = relations(livros, ({ one, many }) => ({
  categoria: one(categorias, {
    fields: [livros.categoriaId],
    references: [categorias.id],
  }),
  emprestimos: many(emprestimos),
  reservas: many(reservas),
}));

export const emprestimosRelations = relations(emprestimos, ({ one, many }) => ({
  usuario: one(users, {
    fields: [emprestimos.usuarioId],
    references: [users.id],
  }),
  livro: one(livros, {
    fields: [emprestimos.livroId],
    references: [livros.id],
  }),
  multas: many(multas),
}));

export const reservasRelations = relations(reservas, ({ one }) => ({
  usuario: one(users, {
    fields: [reservas.usuarioId],
    references: [users.id],
  }),
  livro: one(livros, {
    fields: [reservas.livroId],
    references: [livros.id],
  }),
}));

export const multasRelations = relations(multas, ({ one }) => ({
  emprestimo: one(emprestimos, {
    fields: [multas.emprestimoId],
    references: [emprestimos.id],
  }),
  usuario: one(users, {
    fields: [multas.usuarioId],
    references: [users.id],
  }),
}));

export const logsSistemaRelations = relations(logsSistema, ({ one }) => ({
  usuario: one(users, {
    fields: [logsSistema.usuarioId],
    references: [users.id],
  }),
}));

export const preferenciasUsuarioRelations = relations(preferenciasUsuario, ({ one }) => ({
  usuario: one(users, {
    fields: [preferenciasUsuario.usuarioId],
    references: [users.id],
  }),
}));
