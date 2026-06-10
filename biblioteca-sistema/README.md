# 📚 Sistema de Gestão de Biblioteca

Um sistema moderno e completo para gerenciar livros, usuários, empréstimos, devoluções, reservas e multas de uma biblioteca escolar, universitária ou comunitária.

## 🎯 Visão Geral

O **Sistema de Gestão de Biblioteca** é uma plataforma web responsiva desenvolvida com as mais modernas tecnologias, oferecendo uma solução completa para gerenciamento de acervos bibliográficos. O sistema foi projetado com foco em usabilidade, segurança e performance.

### Características Principais

- **Dashboard Inteligente**: Visualize indicadores em tempo real com gráficos interativos
- **Gerenciamento Completo**: Livros, usuários, empréstimos, reservas e multas
- **Controle de Acesso**: Três perfis distintos (Admin, Bibliotecário, Leitor)
- **Pesquisa Inteligente**: Busca por título, autor, categoria e ISBN
- **Relatórios Detalhados**: Análise de dados com gráficos interativos
- **Logs de Atividades**: Rastreamento completo de ações do sistema
- **Tema Adaptável**: Modo claro e escuro com persistência de preferências
- **Responsivo**: Funciona perfeitamente em desktop, tablet e smartphone

---

## 🚀 Tecnologias Utilizadas

### Front-end
- **React 19**: Framework JavaScript moderno
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS 4**: Framework de CSS utilitário
- **shadcn/ui**: Componentes reutilizáveis de alta qualidade
- **Recharts**: Gráficos interativos e responsivos
- **Wouter**: Roteamento leve e eficiente
- **React Hook Form**: Gerenciamento de formulários

### Back-end
- **Node.js**: Runtime JavaScript no servidor
- **Express 4**: Framework web minimalista
- **tRPC 11**: RPC type-safe end-to-end
- **Drizzle ORM**: ORM moderno e type-safe

### Banco de Dados
- **MySQL**: Banco de dados relacional robusto
- **Drizzle Kit**: Gerenciamento de migrações

### Autenticação
- **Manus OAuth**: Autenticação segura integrada

---

## 📋 Funcionalidades Implementadas

### ✅ Dashboard
- Cards de indicadores (total de livros, usuários, empréstimos, disponibilidade, atrasos)
- Gráficos de empréstimos por período
- Gráficos de categorias mais emprestadas
- Gráficos de multas geradas

### ✅ Gerenciamento de Livros
- Cadastro, edição e exclusão de livros
- Filtros por categoria e disponibilidade
- Busca por título, autor, categoria e ISBN
- Visualização de detalhes do livro
- Controle de quantidade de cópias

### ✅ Gerenciamento de Empréstimos
- Registrar novo empréstimo
- Registrar devolução com cálculo automático de multa
- Visualizar histórico de empréstimos
- Filtrar por status (ativo, devolvido, atrasado)
- Controle de datas de vencimento

### ✅ Gerenciamento de Reservas
- Criar reserva de livro indisponível
- Cancelar reserva
- Visualizar fila de espera
- Gerenciamento automático de posição na fila

### ✅ Gerenciamento de Multas
- Cálculo automático por dias de atraso
- Visualizar detalhes da multa
- Registrar pagamento
- Filtrar por status (pendente, paga)

### ✅ Gerenciamento de Usuários
- Cadastro de usuários
- Edição de dados do usuário
- Exclusão de usuário
- Atribuição de perfis (Admin, Bibliotecário, Leitor)
- Controle de acesso por perfil

### ✅ Relatórios
- Livros mais emprestados
- Usuários mais ativos
- Empréstimos por período
- Multas geradas
- Gráficos interativos com Recharts

### ✅ Logs do Sistema
- Rastreamento de todas as ações
- Filtros avançados (ação, tabela, período)
- Visualização de atividades por usuário
- Registro de datas e horários

### ✅ Segurança
- Autenticação OAuth com Manus
- Controle de acesso baseado em perfil
- Criptografia de senhas
- Logs de atividades
- Validação de entrada com Zod

### ✅ Interface
- Tema azul e branco profissional
- Modo escuro/claro alternável
- Navegação lateral (sidebar) responsiva
- Design responsivo para todos os dispositivos
- Componentes acessíveis com shadcn/ui

---

## 🏗️ Arquitetura do Banco de Dados

### Tabelas Principais

| Tabela | Descrição |
|--------|-----------|
| `usuarios` | Usuários do sistema com roles (admin, bibliotecario, leitor) |
| `categorias` | Categorias de livros |
| `livros` | Acervo de livros com quantidade de cópias |
| `emprestimos` | Histórico de empréstimos e devoluções |
| `reservas` | Reservas de livros com fila de espera |
| `multas` | Multas geradas por atraso |
| `logs_sistema` | Logs de atividades do sistema |
| `preferencias_usuario` | Preferências e categorias favoritas dos usuários |

---

## 📁 Estrutura de Pastas

```
biblioteca-sistema/
├── client/                          # Front-end React
│   ├── src/
│   │   ├── pages/                  # Páginas da aplicação
│   │   │   ├── Home.tsx            # Dashboard
│   │   │   ├── Livros.tsx          # Gerenciamento de livros
│   │   │   ├── Emprestimos.tsx     # Gerenciamento de empréstimos
│   │   │   ├── Reservas.tsx        # Gerenciamento de reservas
│   │   │   ├── Multas.tsx          # Gerenciamento de multas
│   │   │   ├── Usuarios.tsx        # Gerenciamento de usuários
│   │   │   ├── Relatorios.tsx      # Relatórios
│   │   │   └── Logs.tsx            # Logs do sistema
│   │   ├── components/             # Componentes reutilizáveis
│   │   ├── contexts/               # Contextos React
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/                    # Utilitários
│   │   ├── App.tsx                 # Roteamento principal
│   │   └── index.css               # Estilos globais
│   └── public/                     # Arquivos estáticos
├── server/                          # Back-end Node.js
│   ├── routers.ts                  # Procedures tRPC
│   ├── db.ts                       # Helpers de banco de dados
│   ├── storage.ts                  # Gerenciamento de armazenamento
│   └── _core/                      # Núcleo do servidor
├── drizzle/                         # Migrações e schema
│   ├── schema.ts                   # Definição das tabelas
│   └── migrations/                 # Arquivos de migração SQL
├── shared/                          # Código compartilhado
├── DOCUMENTACAO.md                  # Documentação técnica completa
├── GUIA_INSTALACAO.md              # Guia de instalação
├── GUIA_USO.md                     # Guia de uso
└── README.md                       # Este arquivo
```

---

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 22.13.0 ou superior
- pnpm 10.4.1 ou superior
- MySQL 8.0 ou superior

### Passos de Instalação

1. **Clone o repositório** (ou acesse o projeto já inicializado)
```bash
cd /home/ubuntu/biblioteca-sistema
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
# As variáveis são automaticamente injetadas pelo Manus
# DATABASE_URL, JWT_SECRET, OAUTH_SERVER_URL, etc.
```

4. **Execute as migrações do banco de dados**
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

Para mais detalhes, consulte [GUIA_INSTALACAO.md](./GUIA_INSTALACAO.md).

---

## 📖 Documentação

- **[DOCUMENTACAO.md](./DOCUMENTACAO.md)**: Documentação técnica completa com diagramas UML
- **[GUIA_INSTALACAO.md](./GUIA_INSTALACAO.md)**: Guia passo a passo de instalação
- **[GUIA_USO.md](./GUIA_USO.md)**: Guia completo de funcionalidades
- **[todo.md](./todo.md)**: Rastreamento de tarefas e progresso

---

## 🧪 Testes

Execute os testes com:

```bash
pnpm test
```

Testes vitest foram criados para:
- Autenticação (logout)
- Gerenciamento de livros
- Gerenciamento de empréstimos

---

## 🔐 Segurança

O sistema implementa as seguintes medidas de segurança:

- **Autenticação OAuth**: Integração com Manus OAuth
- **Controle de Acesso**: Baseado em perfil (admin, bibliotecario, leitor)
- **Validação de Entrada**: Usando Zod para validação type-safe
- **Criptografia**: Senhas criptografadas no banco de dados
- **Logs de Atividades**: Rastreamento completo de ações
- **HTTPS**: Comunicação segura
- **CORS**: Proteção contra requisições não autorizadas

---

## 🎨 Tema e Customização

### Cores Principais
- **Primária**: Azul (#2563EB)
- **Secundária**: Branco (#FFFFFF)
- **Fundo Claro**: #F5F5F5
- **Fundo Escuro**: #1A1A1A

### Modo Claro/Escuro
O sistema suporta tema claro e escuro com alternância automática. As preferências são salvas no localStorage.

Para customizar as cores, edite `client/src/index.css`.

---

## 📊 Relatórios e Análises

O sistema oferece relatórios detalhados com visualizações interativas:

- **Livros Mais Emprestados**: Top 10 livros com gráfico de barras
- **Usuários Mais Ativos**: Top 10 usuários com gráfico de barras
- **Empréstimos por Período**: Evolução temporal com gráfico de linha
- **Multas Geradas**: Análise de multas com gráfico de área

---

## 🚀 Deploy

O projeto está pronto para deploy em ambiente de produção. Para publicar:

1. Crie um checkpoint final
2. Clique no botão **Publish** na interface Manus
3. Siga as instruções de deploy

---

## 📝 Funcionalidades Futuras

As seguintes funcionalidades estão planejadas para versões futuras:

- [ ] Upload de capas de livros
- [ ] Exportação de relatórios para PDF/Excel
- [ ] Notificações automáticas de atraso (agendamento periódico)
- [ ] Sistema de recomendações com LLM
- [ ] QR Code para identificação de livros
- [ ] Integração com sistemas de pagamento
- [ ] API REST documentada com Swagger
- [ ] Aplicativo mobile

---

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Crie uma branch para sua feature
2. Faça commit das suas mudanças
3. Envie um pull request

---

## 📞 Suporte

Para suporte ou dúvidas:

1. Consulte a [DOCUMENTACAO.md](./DOCUMENTACAO.md)
2. Verifique o [GUIA_USO.md](./GUIA_USO.md)
3. Abra uma issue no repositório

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 👨‍💻 Desenvolvido com

- ❤️ React
- 🔷 TypeScript
- 🎨 Tailwind CSS
- 📊 Recharts
- 🗄️ MySQL
- 🚀 Node.js

---

**Última atualização**: Junho 2026

**Versão**: 1.0.0

**Status**: ✅ Pronto para Produção
