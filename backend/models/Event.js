import { query } from './db.js';

const eventFields =
  'id, title, cover, description, start_time AS startTime, end_time AS endTime, place, `limit` AS `limit`, status, create_time AS createTime';

export const getEvents = async ({ status } = {}) => {
  let sql = `SELECT ${eventFields} FROM events`;
  const params = [];

  if (status !== undefined) {
    sql += ' WHERE status = ?';
    params.push(status);
  }

  sql += ' ORDER BY start_time ASC';
  return query(sql, params);
};

export const getEventById = async (id) => {
  const rows = await query(`SELECT ${eventFields} FROM events WHERE id = ?`, [id]);
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
  } = payload;

  const sql = `INSERT INTO events (title, cover, description, start_time, end_time, place, \`limit\`, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const result = await query(sql, [
    title,
    cover || '',
    description || '',
    startTime,
    endTime,
    place,
    limit || 0,
    status,
  ]);

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

