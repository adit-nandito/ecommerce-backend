const { Pool } = require('pg');

const poolConnection = new Pool({
  user: process.env.USER || 'root',
  host: process.env.HOST || 'localhost',
  database: process.env.DATABASE || 'database',
  port: process.env.PORT || 5432
});

const executeQuery = async (queries, statement = []) => {
  const client = await poolConnection.connect();
  await client.query('BEGIN');
  try {
    const result = await client.query(queries, statement);
    await client.query('COMMIT');
    return Promise.resolve(result.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    return Promise.reject(err);
  } finally {
    client.release();
  }
};

module.exports = {
  executeQuery
};
