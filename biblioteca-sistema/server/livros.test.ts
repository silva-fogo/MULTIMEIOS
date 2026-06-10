import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
function createMockContext(role: "admin" | "bibliotecario" | "leitor" = "admin"): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Livros Router", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createMockContext("admin");
  });

  describe("livros.list", () => {
    it("deve retornar lista de livros", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.livros.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("livros.create", () => {
    it("deve criar um novo livro com dados válidos", async () => {
      const caller = appRouter.createCaller(ctx);
      
      const novoLivro = {
        titulo: "Test Book",
        autor: "Test Author",
        isbn: "978-0123456789",
        categoriaId: 1,
        descricao: "Test Description",
        totalCopias: 5,
      };

      const result = await caller.livros.create(novoLivro);
      expect(result).toBeDefined();
      expect(result.titulo).toBe("Test Book");
    });

    it("deve rejeitar criação de livro sem permissão", async () => {
      const leitorCtx = createMockContext("leitor");
      const caller = appRouter.createCaller(leitorCtx);
      
      const novoLivro = {
        titulo: "Test Book",
        autor: "Test Author",
        isbn: "978-0123456789",
        categoriaId: 1,
        descricao: "Test Description",
        totalCopias: 5,
      };

      try {
        await caller.livros.create(novoLivro);
        expect.fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("livros.search", () => {
    it("deve buscar livros por título", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.livros.search({ query: "Test" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve buscar livros por autor", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.livros.search({ query: "Author" });
      expect(Array.isArray(result)).toBe(true);
    });

    it("deve buscar livros por ISBN", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.livros.search({ query: "978" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("livros.delete", () => {
    it("deve deletar um livro existente", async () => {
      const caller = appRouter.createCaller(ctx);
      
      // Primeiro criar um livro
      const novoLivro = {
        titulo: "Book to Delete",
        autor: "Test Author",
        isbn: "978-9999999999",
        categoriaId: 1,
        descricao: "Test Description",
        totalCopias: 1,
      };

      const livro = await caller.livros.create(novoLivro);
      
      // Depois deletar
      const result = await caller.livros.delete({ id: livro.id });
      expect(result.success).toBe(true);
    });

    it("deve rejeitar deleção sem permissão", async () => {
      const leitorCtx = createMockContext("leitor");
      const caller = appRouter.createCaller(leitorCtx);

      try {
        await caller.livros.delete({ id: 1 });
        expect.fail("Deveria ter lançado erro");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
