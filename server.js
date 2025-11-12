require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'puffrunner_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20, // máximo de clientes no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testar conexão com o banco de dados
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool de conexões:', err);
  process.exit(-1);
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validação de email simples
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validação de role
const VALID_ROLES = ['driver', 'dispensary', 'customer'];
function isValidRole(role) {
  return !role || VALID_ROLES.includes(role.toLowerCase());
}

// Endpoint para receber dados do formulário
app.post('/api/signup', async (req, res) => {
  let client;
  try {
    console.log('📥 Recebendo requisição de cadastro:', req.body);
    client = await pool.connect();
    const { email, role, name } = req.body;

    // Validação
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Email inválido'
      });
    }

    // Validação de role
    if (role && !isValidRole(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role inválido. Use: driver, dispensary ou customer'
      });
    }

    // Verificar se o email já existe
    const checkEmailQuery = 'SELECT id FROM signups WHERE LOWER(email) = LOWER($1)';
    const emailCheck = await client.query(checkEmailQuery, [email.trim()]);

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Este email já está cadastrado'
      });
    }

    // Inserir novo registro
    const insertQuery = `
      INSERT INTO signups (name, email, role, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, name, email, role, created_at
    `;

    const result = await client.query(insertQuery, [
      name.trim(),
      email.trim(),
      role ? role.trim() : null
    ]);

    const signupData = result.rows[0];

    console.log('✅ Cadastro realizado com sucesso:', signupData);

    res.status(201).json({
      success: true,
      message: 'Cadastro realizado com sucesso!',
      data: {
        id: signupData.id,
        name: signupData.name,
        email: signupData.email,
        role: signupData.role,
        created_at: signupData.created_at
      }
    });
  } catch (error) {
    console.error('❌ Erro no endpoint /api/signup:', error);
    console.error('Código do erro:', error.code);
    console.error('Mensagem:', error.message);
    console.error('Stack trace:', error.stack);

    // Tratar erro de constraint única (email duplicado)
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Este email já está cadastrado'
      });
    }

    // Tratar erro de tabela não encontrada
    if (error.code === '42P01') {
      console.error('⚠️ Tabela "signups" não existe! Execute as migrations: npm run migrate');
      return res.status(500).json({
        success: false,
        error: 'Tabela não encontrada. Execute as migrations primeiro.'
      });
    }

    // Tratar erro de conexão com banco
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.error('⚠️ Erro de conexão com o banco de dados!');
      return res.status(503).json({
        success: false,
        error: 'Erro de conexão com o banco de dados. Verifique se o PostgreSQL está rodando.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (client) {
      client.release();
    }
  }
});

// Endpoint opcional para listar todos os cadastros (útil para debug/admin)
app.get('/api/signups', async (req, res) => {
  const client = await pool.connect();
  try {
    const query = 'SELECT id, name, email, role, created_at FROM signups ORDER BY created_at DESC';
    const result = await client.query(query);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar cadastros:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao ler dados'
    });
  } finally {
    client.release();
  }
});

// Endpoint de health check
app.get('/api/health', async (req, res) => {
  const client = await pool.connect();
  try {
    // Testar conexão com o banco
    await client.query('SELECT 1');
    res.json({
      success: true,
      message: 'Servidor está funcionando',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Servidor está funcionando, mas o banco de dados não está acessível',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  } finally {
    client.release();
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Encerrando servidor...');
  await pool.end();
  process.exit(0);
});

// Função para testar conexão com o banco na inicialização
async function testDatabaseConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('✅ Conexão com o banco de dados verificada');

    // Verificar se a tabela existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'signups'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('⚠️ ATENÇÃO: Tabela "signups" não existe!');
      console.error('   Execute as migrations: cd backend && npm run migrate');
    } else {
      console.log('✅ Tabela "signups" encontrada');
    }
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error.message);
    console.error('   Verifique se:');
    console.error('   - O PostgreSQL está rodando');
    console.error('   - As credenciais no arquivo .env estão corretas');
    console.error('   - O banco de dados existe');
  } finally {
    client.release();
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📝 Endpoint de cadastro: http://localhost:${PORT}/api/signup`);
  console.log(`📊 Endpoint de listagem: http://localhost:${PORT}/api/signups`);
  console.log(`💚 Endpoint de health: http://localhost:${PORT}/api/health`);
  console.log('');

  // Testar conexão com o banco
  await testDatabaseConnection();
});

