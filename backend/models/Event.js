import { query } from './db.js';

const eventFields =
  'e.id, e.title, e.cover, e.description, e.start_time AS startTime, e.end_time AS endTime, e.place, e.`limit` AS `limit`, e.status, e.creator_id AS creatorId, e.create_time AS createTime, u.name AS creatorName';

export const getEvents = async ({ status, creatorId } = {}) => {
  let sql = `SELECT ${eventFields} FROM events e LEFT JOIN users u ON e.creator_id = u.id`;
  const params = [];
  const conditions = [];

  if (status !== undefined) {
    conditions.push('e.status = ?');
    params.push(status);
  }

  if (creatorId !== undefined) {
    conditions.push('e.creator_id = ?');
    params.push(creatorId);
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY e.start_time ASC';
  return query(sql, params);
};

export const getEventById = async (id) => {
  const rows = await query(`SELECT ${eventFields} FROM events e LEFT JOIN users u ON e.creator_id = u.id WHERE e.id = ?`, [id]);
  return rows[0];
};

export const createEvent = async (payload) => {
  const {
    title,
    cover,
    description,
    startTime,
    endTime,
    place,
    limit,
    status = 1,
    creatorId,
  } = payload;

  // 确保 creatorId 是有效的正整数
  if (!creatorId) {
    throw new Error('创建者 ID 不能为空');
  }
  
  const numericCreatorId = Number(creatorId);
  if (isNaN(numericCreatorId) || numericCreatorId <= 0 || !Number.isInteger(numericCreatorId)) {
    throw new Error('创建者 ID 必须是有效的正整数');
  }

  const sql = `INSERT INTO events (title, cover, description, start_time, end_time, place, \`limit\`, status, creator_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  const result = await query(sql, [
    title,
    cover || '',
    description || '',
    startTime,
    endTime,
    place,
    limit || 0,
    status,
    numericCreatorId, // 确保是正整数类型
  ]);

  // mysql2 的 execute 返回的 rows 对于 INSERT 操作是 ResultSetHeader 对象，包含 insertId
  if (!result || typeof result.insertId === 'undefined') {
    console.error('INSERT 操作返回结果异常:', result);
    throw new Error('无法获取插入的记录 ID');
  }

  return getEventById(result.insertId);
};

export const updateEvent = async (id, payload) => {
  const fields = [];
  const params = [];

  const mappings = {
    title: 'title',
    cover: 'cover',
    description: 'description',
    startTime: 'start_time',
    endTime: 'end_time',
    place: 'place',
    limit: '`limit`',
    status: 'status',
  };

  Object.entries(mappings).forEach(([key, column]) => {
    if (payload[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(payload[key]);
    }
  });

  if (!fields.length) return getEventById(id);

  const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);
  await query(sql, params);
  return getEventById(id);
};

export const deleteEvent = async (id) => {
  await query('DELETE FROM events WHERE id = ?', [id]);
};

