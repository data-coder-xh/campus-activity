import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 开始检查数据库连接...\n');
  
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'campus_activity',
  };
  
  console.log('数据库配置：');
  console.log(`  Host: ${config.host}`);
  console.log(`  User: ${config.user}`);
  console.log(`  Password: ${config.password ? '***' : '(空)'}`);
  console.log(`  Database: ${config.database}\n`);
  
  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ 数据库连接成功！\n');
    
    // 检查表是否存在
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 找到 ${tables.length} 个表：`);
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    console.log('');
    
    // 检查用户数据
    const [users] = await connection.execute('SELECT username, role FROM users');
    console.log(`👥 用户数据（${users.length} 条）：`);
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.role})`);
    });
    console.log('');
    
    // 检查活动数据
    const [events] = await connection.execute('SELECT id, title, review_status, status FROM events');
    console.log(`🎯 活动数据（${events.length} 条）：`);
    events.forEach(event => {
      console.log(`  - ${event.title} (审核状态: ${event.review_status}, 上线状态: ${event.status})`);
    });
    console.log('');
    
    // 检查已审核通过的活动
    const [approvedEvents] = await connection.execute(
      "SELECT COUNT(*) as count FROM events WHERE review_status = 'approved' AND status = 1"
    );
    console.log(`✅ 已审核通过且上线的活动：${approvedEvents[0].count} 个\n`);
    
    await connection.end();
    console.log('✅ 所有检查完成！');
    
  } catch (error) {
    console.error('❌ 数据库连接失败！\n');
    console.error('错误信息：', error.message);
    console.error('\n请检查：');
    console.error('1. WampServer 的 MySQL 服务是否正在运行');
    console.error('2. backend/.env 文件中的数据库配置是否正确');
    console.error('3. 数据库 campus_activity 是否已创建');
    process.exit(1);
  }
}

testConnection();

