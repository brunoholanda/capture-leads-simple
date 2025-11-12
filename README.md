# Backend PuffRunner - Express API com PostgreSQL

Backend simples em Express para capturar dados do formulário de waitlist (name, email e role) usando PostgreSQL.

## 📋 Requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- PostgreSQL (versão 12 ou superior)

## 🗄️ Configuração do Banco de Dados

### 1. Instalar PostgreSQL

Certifique-se de que o PostgreSQL está instalado e rodando em sua máquina.

### 2. Criar o Banco de Dados

Crie um banco de dados para o projeto:

```sql
CREATE DATABASE puffrunner_db;
```

### 3. Configurar Variáveis de Ambiente

1. Copie o arquivo de exemplo:
```bash
cp env.example .env
```

2. Edite o arquivo `.env` com suas credenciais:

```env
# Configuração do Banco de Dados PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=puffrunner_db
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui

# Porta do servidor Express
PORT=3000

# Ambiente (development, production)
NODE_ENV=development
```

**⚠️ Importante**: Nunca commite o arquivo `.env` no repositório!

## 🚀 Instalação

1. Instale as dependências:
```bash
npm install
```

2. Execute as migrations para criar as tabelas:
```bash
npm run migrate
```

Isso criará a tabela `signups` com todas as colunas necessárias.

## ▶️ Como executar

### Modo desenvolvimento (com auto-reload):
```bash
npm run dev
```

### Modo produção:
```bash
npm start
```

O servidor estará rodando em `http://localhost:3000`

## 📡 Endpoints

### POST `/api/signup`
Recebe os dados do formulário de cadastro.

**Body (JSON):**
```json
{
  "name": "João Silva",
  "email": "usuario@exemplo.com",
  "role": "driver"
}
```

**Respostas:**
- `201 Created`: Cadastro realizado com sucesso
- `400 Bad Request`: Dados inválidos ou faltando
- `409 Conflict`: Email já cadastrado
- `500 Internal Server Error`: Erro ao salvar dados

**Exemplo de resposta:**
```json
{
  "success": true,
  "message": "Cadastro realizado com sucesso!",
  "data": {
    "id": 1,
    "name": "João Silva",
    "email": "usuario@exemplo.com",
    "role": "driver",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET `/api/signups`
Lista todos os cadastros realizados (útil para debug/admin).

**Resposta:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "usuario@exemplo.com",
      "role": "driver",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET `/api/health`
Verifica se o servidor e o banco de dados estão funcionando.

**Resposta:**
```json
{
  "success": true,
  "message": "Servidor está funcionando",
  "database": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🗄️ Migrations

### Executar migrations
```bash
npm run migrate
```

### Criar nova migration
```bash
npm run migrate:create nome_da_migration
```

### Reverter última migration
```bash
npm run migrate:down
```

## 📝 Validações

- **Name**: Obrigatório (não pode estar vazio)
- **Email**: Obrigatório e deve ter formato válido
- **Role**: Opcional, mas se fornecido deve ser: `driver`, `dispensary` ou `customer`
- **Email duplicado**: O sistema verifica se o email já foi cadastrado (constraint única no banco)

## 🗂️ Estrutura do Banco de Dados

### Tabela: `signups`

| Coluna      | Tipo          | Descrição                    |
|-------------|---------------|------------------------------|
| id          | serial        | Chave primária (auto-incremento) |
| name        | varchar(255)  | Nome do usuário (obrigatório) |
| email       | varchar(255)  | Email (obrigatório, único)   |
| role        | varchar(50)   | Role (opcional)              |
| created_at  | timestamp     | Data de criação (automático) |

**Índices:**
- Índice único em `email`
- Índice em `role` para buscas rápidas

## 🛠️ Estrutura do Projeto

```
backend/
├── server.js              # Servidor Express
├── package.json           # Dependências do projeto
├── .env                   # Variáveis de ambiente (não commitar!)
├── env.example            # Template de configuração
├── migrate.json           # Configuração das migrations
├── migrations/
│   └── 001_create_signups_table.js  # Migration inicial
├── scripts/
│   └── run-migrations.js  # Script auxiliar para migrations
└── README.md              # Este arquivo
```

## 🔧 Configuração

### Porta do servidor
Por padrão, o servidor roda na porta 3000. Para alterar, defina a variável de ambiente `PORT` no arquivo `.env`.

### Endpoint no frontend
O arquivo `script.js` na raiz do projeto está configurado para usar `http://localhost:3000/api/signup`. Se você alterar a porta ou o host, atualize a constante `FORM_ENDPOINT` no arquivo `script.js`.

## 🔒 Segurança

⚠️ **Nota**: Este é um backend simples para desenvolvimento. Para produção, considere:
- Adicionar rate limiting
- Implementar autenticação para endpoints administrativos
- Usar SSL/TLS para conexões com o banco de dados
- Adicionar validação mais robusta
- Implementar HTTPS
- Adicionar logs e monitoramento
- Usar variáveis de ambiente seguras (nunca commitar `.env`)
- Implementar backup automático do banco de dados

## 📦 Dependências

- **express**: Framework web para Node.js
- **cors**: Middleware para habilitar CORS
- **pg**: Cliente PostgreSQL para Node.js
- **dotenv**: Carregamento de variáveis de ambiente
- **node-pg-migrate**: Sistema de migrations para PostgreSQL
- **nodemon** (dev): Auto-reload em desenvolvimento

## 🐛 Troubleshooting

### Erro de conexão com o banco de dados
- Verifique se o PostgreSQL está rodando
- Confirme as credenciais no arquivo `.env`
- Verifique se o banco de dados `puffrunner_db` foi criado
- Teste a conexão manualmente: `psql -U postgres -d puffrunner_db`

### Erro ao executar migrations
- Certifique-se de que o banco de dados existe
- Verifique as credenciais no arquivo `.env`
- Execute manualmente: `psql -U postgres -d puffrunner_db -f migrations/001_create_signups_table.sql` (se necessário)

### Tabela já existe
Se a tabela já existe e você quer recriá-la, você pode:
1. Dropar a tabela manualmente: `DROP TABLE signups CASCADE;`
2. Executar as migrations novamente: `npm run migrate`

