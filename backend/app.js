import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import eventsRouter from './routes/events.js';
import usersRouter from './routes/users.js';
import registrationsRouter from './routes/registrations.js';
import authRouter from './routes/auth.js';
import testRouter from './routes/test.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 9000;

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/events', eventsRouter);
app.use('/api/users', usersRouter);
app.use('/api/registrations', registrationsRouter);
app.use('/api/test', testRouter);

app.use((req, res, next) => {
  res.status(404).json({ message: '资源不存在' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error('服务器错误:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    errno: err.errno,
    sqlState: err.sqlState,
    sqlMessage: err.sqlMessage,
    path: req.path,
    method: req.method,
  });
  res.status(status).json({
    message: err.message || '服务器错误',
    detail: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// 测试环境下不启动监听端口，方便 Jest/Supertest 直接 import app 进行接口测试
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
  });
}

export default app;

