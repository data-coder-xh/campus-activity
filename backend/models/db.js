import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'campus_activity',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 10,
  multipleStatements: true,
  timezone: '+00:00',
});

pool.on('error', (err) => {
  console.error('数据库连接池错误：', err);
});

export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('数据库查询错误:', {
      sql,
      params,
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
    });
    throw error;
  }
};

export default pool;

