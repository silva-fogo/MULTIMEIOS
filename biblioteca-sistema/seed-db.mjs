import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL não está definida');
  process.exit(1);
}

async function seedDatabase() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL);
    const config = {
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      port: url.port || 3306,
      ssl: { rejectUnauthorized: false },
    };

    connection = await mysql.createConnection(config);
    console.log('✅ Conectado ao banco de dados');

    // Inserir usuários de teste
    const usuarios = [
      {
        openId: 'admin-test',
        name: 'Administrador',
        email: 'admin@biblioteca.com',
        role: 'admin',
        loginMethod: 'email',
        telefone: '11999999999',
        endereco: 'Rua Admin, 123',
        ativo: true,
        senha: 'admin123',
      },
      {
        openId: 'bibliotecario-test',
        name: 'Bibliotecário',
        email: 'bibliotecario@biblioteca.com',
        role: 'bibliotecario',
        loginMethod: 'email',
        telefone: '11988888888',
        endereco: 'Rua Bib, 456',
        ativo: true,
        senha: 'bibliotecario123',
      },
      {
        openId: 'leitor-test',
        name: 'Leitor',
        email: 'leitor@biblioteca.com',
        role: 'leitor',
        loginMethod: 'email',
        telefone: '11977777777',
        endereco: 'Rua Leitor, 789',
        ativo: true,
        senha: 'leitor123',
      },
    ];

    for (const usuario of usuarios) {
      try {
        // Gerar hash de senha
        const passwordHash = await bcrypt.hash(usuario.senha, 10);
        
        const query = `
          INSERT INTO users (openId, name, email, role, loginMethod, telefone, endereco, ativo, password_hash, createdAt, updatedAt, lastSignedIn)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          role = VALUES(role),
          telefone = VALUES(telefone),
          endereco = VALUES(endereco),
          ativo = VALUES(ativo),
          password_hash = VALUES(password_hash)
        `;
        
        await connection.execute(query, [
          usuario.openId,
          usuario.name,
          usuario.email,
          usuario.role,
          usuario.loginMethod,
          usuario.telefone,
          usuario.endereco,
          usuario.ativo ? 1 : 0,
          passwordHash,
        ]);
        
        console.log(`✅ Usuário ${usuario.email} inserido/atualizado (senha: ${usuario.senha})`);
      } catch (error) {
        console.error(`❌ Erro ao inserir usuário ${usuario.email}:`, error.message);
      }
    }

    // Inserir categorias de teste
    const categorias = [
      { nome: 'Ficção Científica', descricao: 'Livros de ficção científica' },
      { nome: 'Romance', descricao: 'Livros de romance' },
      { nome: 'Mistério', descricao: 'Livros de mistério e suspense' },
      { nome: 'Educação', descricao: 'Livros educacionais' },
      { nome: 'História', descricao: 'Livros de história' },
      { nome: 'Tecnologia', descricao: 'Livros sobre tecnologia' },
    ];

    for (const categoria of categorias) {
      try {
        const query = `
          INSERT INTO categorias (nome, descricao, createdAt, updatedAt)
          VALUES (?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          descricao = VALUES(descricao)
        `;
        
        await connection.execute(query, [categoria.nome, categoria.descricao]);
        console.log(`✅ Categoria ${categoria.nome} inserida/atualizada`);
      } catch (error) {
        console.error(`❌ Erro ao inserir categoria ${categoria.nome}:`, error.message);
      }
    }

    // Inserir livros de teste
    const livros = [
      {
        titulo: 'Duna',
        autor: 'Frank Herbert',
        isbn: '978-0441013593',
        categoriaId: 1,
        descricao: 'Uma épica de ficção científica sobre política, religião e ecologia',
        totalCopias: 3,
      },
      {
        titulo: 'O Senhor dos Anéis',
        autor: 'J.R.R. Tolkien',
        isbn: '978-0544003415',
        categoriaId: 1,
        descricao: 'Uma trilogia de fantasia épica',
        totalCopias: 5,
      },
      {
        titulo: 'Orgulho e Preconceito',
        autor: 'Jane Austen',
        isbn: '978-0141439518',
        categoriaId: 2,
        descricao: 'Um clássico romance do século XIX',
        totalCopias: 2,
      },
      {
        titulo: 'O Assassinato de Roger Ackroyd',
        autor: 'Agatha Christie',
        isbn: '978-0062693556',
        categoriaId: 3,
        descricao: 'Um mistério clássico de Agatha Christie',
        totalCopias: 2,
      },
      {
        titulo: 'O Código da Vinci',
        autor: 'Dan Brown',
        isbn: '978-0307474278',
        categoriaId: 3,
        descricao: 'Um thriller de mistério e arte',
        totalCopias: 4,
      },
      {
        titulo: 'Python para Análise de Dados',
        autor: 'Wes McKinney',
        isbn: '978-1491957660',
        categoriaId: 6,
        descricao: 'Guia prático de análise de dados com Python',
        totalCopias: 3,
      },
    ];

    for (const livro of livros) {
      try {
        const query = `
          INSERT INTO livros (titulo, autor, isbn, categoria_id, descricao, total_copias, copias_disponiveis, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
          descricao = VALUES(descricao),
          total_copias = VALUES(total_copias),
          copias_disponiveis = VALUES(copias_disponiveis)
        `;
        
        await connection.execute(query, [
          livro.titulo,
          livro.autor,
          livro.isbn,
          livro.categoriaId,
          livro.descricao,
          livro.totalCopias,
          livro.totalCopias,
        ]);
        
        console.log(`✅ Livro ${livro.titulo} inserido/atualizado`);
      } catch (error) {
        console.error(`❌ Erro ao inserir livro ${livro.titulo}:`, error.message);
      }
    }

    console.log('\n✅ Banco de dados populado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

seedDatabase();
