require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

// Construir a URL de conexão do banco de dados
const dbUrl = `postgres://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD)}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;

// Executar migrations
try {
  console.log('🔄 Executando migrations...');
  console.log(`📊 Conectando ao banco: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}`);

  execSync('node-pg-migrate up', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      DATABASE_URL: dbUrl
    }
  });
  console.log('✅ Migrations executadas com sucesso!');
} catch (error) {
  console.error('❌ Erro ao executar migrations:', error.message);
  console.error('\n💡 Dica: Verifique se:');
  console.error('   - O PostgreSQL está rodando');
  console.error('   - O banco de dados existe');
  console.error('   - As credenciais no arquivo .env estão corretas');
  process.exit(1);
}

