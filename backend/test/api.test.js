import request from 'supertest';
import app from '../app.js';
import pool from '../models/db.js';

const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

describe('校园活动报名系统 API 测试（6个用例）', () => {
  let adminToken;
  let studentToken;
  let testEventId;
  let testRegistrationId;

  beforeAll(async () => {
    // 仅在测试环境可用：清理历史测试数据，避免唯一键冲突
    await request(app).delete('/api/test/cleanup').expect(200);
  });

  afterAll(async () => {
    await request(app).delete('/api/test/cleanup').expect(200);
    // 关闭 MySQL 连接池，避免 Jest 报 open handles 导致进程不退出
    await pool.end();
  });

  test('5.2.1 注册接口测试 - POST /api/auth/register', async () => {
    const suffix = uniqueSuffix();
    const payload = {
      username: `test_student_${suffix}`, // 以 test_ 开头，便于 /api/test/cleanup 清理
      password: 'test123',
      name: '测试学生',
      studentId: `2025${String(Date.now()).slice(-8)}`, // 尽量避免与已有数据冲突
      phone: '13800138001',
      college: '计算机学院',
      major: '软件工程',
    };

    const res = await request(app).post('/api/auth/register').send(payload).expect(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role', 'student');
    studentToken = res.body.token;
  });

  test('5.2.2 登录接口测试 - POST /api/auth/login（管理员）', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'admin123' })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('role', 'admin');
    adminToken = res.body.token;
  });

  test('5.2.3 获取活动列表测试 - GET /api/events?status=1', async () => {
    const res = await request(app).get('/api/events?status=1').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('5.2.4 创建活动测试 - POST /api/events（管理员）', async () => {
    const suffix = uniqueSuffix();
    const payload = {
      title: `API测试活动_${suffix}`, // 以 API测试 开头，便于 /api/test/cleanup 清理
      description: '用于API自动化测试的活动',
      startTime: '2025-12-25 14:00:00',
      endTime: '2025-12-25 16:00:00',
      place: '测试中心',
      limit: 50,
      cover: '',
    };

    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('title', payload.title);
    testEventId = res.body.id;
  });

  test('5.2.5 提交报名测试 - POST /api/registrations（学生）', async () => {
    const suffix = uniqueSuffix();
    const payload = {
      eventId: testEventId,
      remark: `通过API测试报名_${suffix}`, // 以“通过API测试”开头，便于 /api/test/cleanup 清理
    };

    const res = await request(app)
      .post('/api/registrations')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(payload)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('eventId', testEventId);
    expect(res.body).toHaveProperty('status', 0);
    testRegistrationId = res.body.id;
  });

  test('5.2.6 更新报名状态测试 - PATCH /api/registrations/:id/status（管理员）', async () => {
    const res = await request(app)
      .patch(`/api/registrations/${testRegistrationId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 1 })
      .expect(200);

    expect(res.body).toHaveProperty('id', testRegistrationId);
    expect(res.body).toHaveProperty('status', 1);
  });
});
