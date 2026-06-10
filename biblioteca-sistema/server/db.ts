import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  categorias, 
  livros, 
  emprestimos, 
  reservas, 
  multas, 
  logsSistema,
  preferenciasUsuario,
  Livro,
  Emprestimo,
  Reserva,
  Multa,
  LogSistema,
  Categoria,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "telefone", "endereco"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (user.ativo !== undefined) {
      values.ativo = user.ativo;
      updateSet.ativo = user.ativo;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function createUser(data: {
  name: string;
  email: string;
  role: "admin" | "bibliotecario" | "leitor";
  telefone?: string;
  endereco?: string;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(users).values({
      name: data.name,
      email: data.email,
      role: data.role,
      telefone: data.telefone,
      endereco: data.endereco,
      openId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      loginMethod: "manual",
      ativo: true,
    });
    const users_list = await db.select().from(users).orderBy(desc(users.id)).limit(1);
    return users_list[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create user:", error);
    return null;
  }
}

export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(users).set(updates).where(eq(users.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update user:", error);
    return false;
  }
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(users).where(eq(users.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete user:", error);
    return false;
  }
}

// Categorias
export async function getAllCategorias() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(categorias).orderBy(asc(categorias.nome));
}

export async function getCategoriaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categorias).where(eq(categorias.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCategoria(data: { nome: string; descricao?: string }) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(categorias).values({
      nome: data.nome,
      descricao: data.descricao,
    });
    const cats = await db.select().from(categorias).orderBy(desc(categorias.id)).limit(1);
    return cats[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create categoria:", error);
    return null;
  }
}

// Livros
export async function getAllLivros() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(livros).orderBy(desc(livros.createdAt));
}

export async function getLivroById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(livros).where(eq(livros.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function searchLivros(query: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(livros).where(
    sql`${livros.titulo} LIKE ${`%${query}%`} OR ${livros.autor} LIKE ${`%${query}%`} OR ${livros.isbn} LIKE ${`%${query}%`}`
  );
}

export async function createLivro(data: {
  titulo: string;
  autor: string;
  isbn?: string;
  categoriaId: number;
  descricao?: string;
  totalCopias: number;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(livros).values({
      titulo: data.titulo,
      autor: data.autor,
      isbn: data.isbn,
      categoriaId: data.categoriaId,
      descricao: data.descricao,
      totalCopias: data.totalCopias,
      copiasDisponiveis: data.totalCopias,
    });
    const books = await db.select().from(livros).orderBy(desc(livros.id)).limit(1);
    return books[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create livro:", error);
    return null;
  }
}

export async function updateLivro(id: number, updates: Partial<Livro>) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(livros).set(updates).where(eq(livros.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update livro:", error);
    return false;
  }
}

export async function deleteLivro(id: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.delete(livros).where(eq(livros.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to delete livro:", error);
    return false;
  }
}

// Empréstimos
export async function getAllEmprestimos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emprestimos).orderBy(desc(emprestimos.createdAt));
}

export async function getEmprestimoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emprestimos).where(eq(emprestimos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createEmprestimo(data: {
  usuarioId: number;
  livroId: number;
  dataDevolucaoPrevista: Date;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    await db.insert(emprestimos).values({
      usuarioId: data.usuarioId,
      livroId: data.livroId,
      dataEmprestimo: new Date(),
      dataDevolucaoPrevista: data.dataDevolucaoPrevista,
      status: "ativo",
    });
    const emps = await db.select().from(emprestimos).orderBy(desc(emprestimos.id)).limit(1);
    return emps[0] || null;
  } catch (error) {
    console.error("[Database] Failed to create emprestimo:", error);
    return null;
  }
}

export async function registrarDevolucao(emprestimoId: number, dataDevolucao: Date) {
  const db = await getDb();
  if (!db) return false;
  try {
    const emprestimo = await getEmprestimoById(emprestimoId);
    if (!emprestimo) return false;

    let status: "ativo" | "devolvido" | "atrasado" = "devolvido";
    let multaGerada = false;

    // Verificar se está atrasado
    if (dataDevolucao > emprestimo.dataDevolucaoPrevista) {
      status = "atrasado";
      multaGerada = true;

      // Calcular multa
      const diasAtraso = Math.ceil(
        (dataDevolucao.getTime() - emprestimo.dataDevolucaoPrevista.getTime()) / (1000 * 60 * 60 * 24)
      );
      const valorMulta = diasAtraso * 5; // R$ 5 por dia

      // Criar multa
      await db.insert(multas).values({
        emprestimoId,
        usuarioId: emprestimo.usuarioId,
        valor: String(valorMulta),
        dataGeracao: new Date(),
        status: "pendente",
      });
    }

    // Atualizar empréstimo
    await db.update(emprestimos).set({
      dataDevolucaoReal: dataDevolucao,
      status: status as "ativo" | "devolvido" | "atrasado",
    }).where(eq(emprestimos.id, emprestimoId));

    // Aumentar disponibilidade do livro
    const livro = await getLivroById(emprestimo.livroId);
    if (livro) {
      await updateLivro(emprestimo.livroId, {
        copiasDisponiveis: (livro.copiasDisponiveis || 0) + 1,
      });
    }

    return true;
  } catch (error) {
    console.error("[Database] Failed to register devolucao:", error);
    return false;
  }
}

export async function getEmprestimosAtrasados() {
  const db = await getDb();
  if (!db) return [];
  const agora = new Date();
  return await db.select().from(emprestimos).where(
    and(
      eq(emprestimos.status, "ativo"),
      lte(emprestimos.dataDevolucaoPrevista, agora)
    )
  );
}

export async function getTotalEmprestimosAtivos() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(emprestimos).where(eq(emprestimos.status, "ativo"));
  return result[0]?.count || 0;
}

// Reservas
export async function getAllReservas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reservas).orderBy(desc(reservas.createdAt));
}

export async function createReserva(data: {
  usuarioId: number;
  livroId: number;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    // Contar quantas reservas já existem para este livro
    const existentes = await db.select({ count: sql<number>`COUNT(*)` }).from(reservas).where(
      and(eq(reservas.livroId, data.livroId), eq(reservas.status, "ativa"))
    );
    const posicao = (existentes[0]?.count || 0) + 1;

    const result = await db.insert(reservas).values({
      usuarioId: data.usuarioId,
      livroId: data.livroId,
      dataReserva: new Date(),
      status: "ativa",
      posicaoFila: posicao,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create reserva:", error);
    return null;
  }
}

export async function cancelarReserva(reservaId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(reservas).set({
      status: "cancelada",
      dataCancelamento: new Date(),
    }).where(eq(reservas.id, reservaId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to cancel reserva:", error);
    return false;
  }
}

// Multas
export async function getAllMultas() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(multas).orderBy(desc(multas.createdAt));
}

export async function registrarPagamentoMulta(multaId: number) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(multas).set({
      status: "paga",
      dataPagamento: new Date(),
    }).where(eq(multas.id, multaId));
    return true;
  } catch (error) {
    console.error("[Database] Failed to register multa payment:", error);
    return false;
  }
}

// Logs do Sistema
export async function createLog(data: {
  usuarioId?: number;
  acao: string;
  descricao?: string;
  tabelaAfetada?: string;
  registroId?: number;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(logsSistema).values({
      usuarioId: data.usuarioId,
      acao: data.acao,
      descricao: data.descricao,
      tabelaAfetada: data.tabelaAfetada,
      registroId: data.registroId,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create log:", error);
    return null;
  }
}

export async function getAllLogs() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(logsSistema).orderBy(desc(logsSistema.createdAt));
}

export async function getLogsWithUserInfo(filters: {
  acao?: string;
  tabelaAfetada?: string;
  dataInicio?: Date;
  dataFim?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  let conditions: any[] = [];

  if (filters.acao) {
    conditions.push(eq(logsSistema.acao, filters.acao));
  }

  if (filters.tabelaAfetada) {
    conditions.push(eq(logsSistema.tabelaAfetada, filters.tabelaAfetada));
  }

  if (filters.dataInicio) {
    conditions.push(gte(logsSistema.createdAt, filters.dataInicio));
  }

  if (filters.dataFim) {
    conditions.push(lte(logsSistema.createdAt, filters.dataFim));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const logs = await db.select().from(logsSistema).where(whereClause).orderBy(desc(logsSistema.createdAt));

  // Enriquecer com informações de usuário
  const logsEnriquecidos = await Promise.all(
    logs.map(async (log) => {
      let userName = "Sistema";
      if (log.usuarioId) {
        const user = await getUserById(log.usuarioId);
        userName = user?.name || `Usuário ${log.usuarioId}`;
      }
      return {
        ...log,
        userName,
      };
    })
  );

  return logsEnriquecidos;
}

// Preferências de Usuário
export async function getPreferenciaUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(preferenciasUsuario).where(eq(preferenciasUsuario.usuarioId, usuarioId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Dashboard
export async function getTotalLivros() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(livros);
  return result[0]?.count || 0;
}

export async function getTotalUsuarios() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(users);
  return result[0]?.count || 0;
}

export async function getTotalLivrosDisponiveis() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(livros).where(
    sql`${livros.copiasDisponiveis} > 0`
  );
  return result[0]?.count || 0;
}

export async function getLivrosMaisEmprestados(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: livros.id,
    titulo: livros.titulo,
    autor: livros.autor,
    total: sql<number>`COUNT(${emprestimos.id})`,
  }).from(livros).leftJoin(emprestimos, eq(livros.id, emprestimos.livroId)).groupBy(livros.id).orderBy(desc(sql<number>`COUNT(${emprestimos.id})`)).limit(limit);
}

export async function getUsuariosMaisAtivos(limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    total: sql<number>`COUNT(${emprestimos.id})`,
  }).from(users).leftJoin(emprestimos, eq(users.id, emprestimos.usuarioId)).groupBy(users.id).orderBy(desc(sql<number>`COUNT(${emprestimos.id})`)).limit(limit);
}


export async function getMultasByUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(multas).where(eq(multas.usuarioId, usuarioId)).orderBy(desc(multas.createdAt));
}

export async function getMultasPendentes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(multas).where(eq(multas.status, "pendente")).orderBy(desc(multas.createdAt));
}

export async function updateMulta(id: number, updates: Partial<Multa>) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(multas).set(updates).where(eq(multas.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update multa:", error);
    return false;
  }
}

export async function updatePreferenciaUsuario(usuarioId: number, categoriasPreferidas: number[]) {
  const db = await getDb();
  if (!db) return false;
  try {
    const existing = await getPreferenciaUsuario(usuarioId);
    if (existing) {
      await db.update(preferenciasUsuario).set({
        categoriasPreferidas: JSON.stringify(categoriasPreferidas),
      }).where(eq(preferenciasUsuario.usuarioId, usuarioId));
    } else {
      await db.insert(preferenciasUsuario).values({
        usuarioId,
        categoriasPreferidas: JSON.stringify(categoriasPreferidas),
      });
    }
    return true;
  } catch (error) {
    console.error("[Database] Failed to update preferencia:", error);
    return false;
  }
}


export async function getReservasByUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reservas).where(eq(reservas.usuarioId, usuarioId)).orderBy(desc(reservas.createdAt));
}

export async function updateReserva(id: number, updates: Partial<Reserva>) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(reservas).set(updates).where(eq(reservas.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update reserva:", error);
    return false;
  }
}


export async function getReservasByLivro(livroId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(reservas).where(
    and(eq(reservas.livroId, livroId), eq(reservas.status, "ativa"))
  ).orderBy(asc(reservas.posicaoFila));
}


export async function updateEmprestimo(id: number, updates: Partial<Emprestimo>) {
  const db = await getDb();
  if (!db) return false;
  try {
    await db.update(emprestimos).set(updates).where(eq(emprestimos.id, id));
    return true;
  } catch (error) {
    console.error("[Database] Failed to update emprestimo:", error);
    return false;
  }
}

export async function createMulta(data: {
  emprestimoId: number;
  usuarioId: number;
  valor: number;
}) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.insert(multas).values({
      emprestimoId: data.emprestimoId,
      usuarioId: data.usuarioId,
      valor: String(data.valor),
      dataGeracao: new Date(),
      status: "pendente",
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create multa:", error);
    return null;
  }
}


export async function getEmprestimosAtivos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emprestimos).where(eq(emprestimos.status, "ativo")).orderBy(desc(emprestimos.createdAt));
}


export async function getEmprestimosByUsuario(usuarioId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emprestimos).where(eq(emprestimos.usuarioId, usuarioId)).orderBy(desc(emprestimos.createdAt));
}


export async function getLivrosByCategoria(categoriaId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(livros).where(eq(livros.categoriaId, categoriaId)).orderBy(desc(livros.createdAt));
}


export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  try {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get user by email:", error);
    return null;
  }
}


export async function createUserWithEmail(email: string, name: string, passwordHash: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Gerar um openId único
    const openId = `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await db.insert(users).values({
      openId,
      email,
      name,
      passwordHash,
      role: "leitor",
      loginMethod: "email",
      ativo: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    return { success: true, message: "Usuário criado com sucesso" };
  } catch (error: any) {
    console.error("[Database] Failed to create user:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return { success: false, message: "Email já cadastrado" };
    }
    throw error;
  }
}
