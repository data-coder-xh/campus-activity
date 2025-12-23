import express from 'express';
import { query } from '../models/db.js';

const router = express.Router();

// 测试数据清理接口（仅在测试环境中可用）
if (process.env.NODE_ENV === 'test') {
  router.delete('/cleanup', async (req, res) => {
    try {
      // 注意外键约束：先删报名，再删活动/用户
      await query('DELETE FROM registrations WHERE remark LIKE ?', ['通过API测试%']);
      await query('DELETE FROM events WHERE title LIKE ?', ['API测试%']);
      await query('DELETE FROM users WHERE username LIKE ?', ['test_%']);

      res.json({ message: '测试数据清理完成' });
    } catch (error) {
      console.error('清理测试数据失败:', error);
      res.status(500).json({ message: '清理测试数据失败', error: error.message });
    }
  });
}

export default router;
