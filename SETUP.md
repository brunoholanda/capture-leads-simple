# 🚀 Guia Rápido de Configuração

## Passo a Passo

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados PostgreSQL

#### Criar o banco de dados:
```sql
CREATE DATABASE puffrunner_db;
```

#### Ou via linha de comando:
```bash
createdb -U postgres puffrunner_db
```

### 3. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
cp env.example .env
```

Edite o arquivo `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=puffrunner_db
DB_USER=postgres
DB_PASSWORD=sua_senha_aqui
PORT=3000
NODE_ENV=development
```

### 4. Executar Migrations

Crie as tabelas no banco de dados:
```bash
npm run migrate
```

### 5. Iniciar o Servidor

```bash
npm run dev
```

O servidor estará rodando em `http://localhost:3000`

## ✅ Verificar se está funcionando

Acesse: `http://localhost:3000/api/health`

Você deve ver:
```json
{
  "success": true,
  "message": "Servidor está funcionando",
  "database": "connected",
  "timestamp": "..."
}
```

## 🐛 Problemas Comuns

### Erro: "relation signups does not exist"
**Solução**: Execute as migrations: `npm run migrate`

### Erro: "password authentication failed"
**Solução**: Verifique a senha no arquivo `.env`

### Erro: "database puffrunner_db does not exist"
**Solução**: Crie o banco de dados primeiro (veja passo 2)

### Erro: "connect ECONNREFUSED"
**Solução**: Verifique se o PostgreSQL está rodando:
- Windows: Verifique os serviços
- Linux/Mac: `sudo service postgresql start` ou `brew services start postgresql`

