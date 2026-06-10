# Biblioteca Sistema

Sistema web de gerenciamento de bibliotecas desenvolvido para controlar livros, usuários, empréstimos, reservas, multas e relatórios de forma simples e eficiente.

## Funcionalidades

* Cadastro e gerenciamento de livros
* Controle de usuários
* Empréstimos e devoluções
* Reserva de livros
* Gestão de multas
* Relatórios gerenciais
* Registro de logs do sistema
* Dashboard com indicadores
* Autenticação de usuários

##  Tecnologias Utilizadas

### Front-end

* React
* TypeScript
* Vite
* Tailwind CSS

### Back-end

* Node.js
* Express
* TypeScript

### Banco de Dados

* PostgreSQL
* Drizzle ORM

##  Estrutura do Projeto

```text
client/
server/
drizzle/
references/
package.json
```

## ⚙️ Instalação

### 1. Clonar o projeto

```bash
git clone <repositorio>
cd biblioteca-sistema
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Criar arquivo:

```env
DATABASE_URL=sua_url_do_banco
```

### 4. Executar migrações

```bash
npm run db:push
```

### 5. Iniciar o projeto

```bash
npm run dev
```

##  Módulos do Sistema

### Livros

* Cadastro
* Edição
* Exclusão
* Consulta

### Usuários

* Cadastro
* Login
* Controle de acesso

### Empréstimos

* Registro
* Devolução
* Histórico

### Reservas

* Solicitação
* Cancelamento

### Multas

* Cálculo automático
* Pagamento

### Relatórios

* Livros mais emprestados
* Usuários ativos
* Empréstimos por período

##  Segurança

* Autenticação de usuários
* Controle de permissões
* Registro de atividades
* Proteção de rotas

##  Autor

Antonio Patrick Silva Tavares

##  Licença

Este projeto está licenciado sob a licença MIT.
