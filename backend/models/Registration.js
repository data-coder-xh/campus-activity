import { query } from './db.js';

const registrationFields = `r.id,
  r.user_id AS userId,
  r.event_id AS eventId,
  r.remark,
  r.status,
  r.create_time AS createTime,
  u.name AS userName,
  u.student_id AS studentId,
  u.phone,
  u.major,
  e.title AS eventTitle`;

export const getRegistrationById = async (id) => {
  const rows = await query(
    `SELECT ${registrationFields}
     FROM registrations r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN events e ON r.event_id = e.id
     WHERE r.id = ?`,
    [id]
  );
  return rows[0];
};

export const getRegistrations = async ({ userId, eventId, status } = {}) => {
  const conditions = [];
  const params = [];

  if (userId) {
    conditions.push('r.user_id = ?');
    params.push(userId);
  }

  if (eventId) {
    conditions.push('r.event_id = ?');
    params.push(eventId);
  }

  if (status !== undefined) {
    conditions.push('r.status = ?');
    params.push(status);
  }

  const sql = `SELECT ${registrationFields}
               FROM registrations r
               LEFT JOIN users u ON r.user_id = u.id
               LEFT JOIN events e ON r.event_id = e.id
               ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
               ORDER BY r.create_time DESC`;

  return query(sql, params);
};

export const countRegistrationsByEvent = async (eventId) => {
  const rows = await query('SELECT COUNT(*) AS total FROM registrations WHERE event_id = ? AND status IN (0,1)', [
    eventId,
  ]);
  return rows[0]?.total || 0;
};

export const createRegistration = async ({ userId, eventId, remark }) => {
  const sql = 'INSERT INTO registrations (user_id, event_id, remark) VALUES (?, ?, ?)';
  const result = await query(sql, [userId, eventId, remark || '']);
  return getRegistrationById(result.insertId);
};

export const updateRegistrationStatus = async (id, status) => {
  await query('UPDATE registrations SET status = ? WHERE id = ?', [status, id]);
  return getRegistrationById(id);
};

export const findExisting = async (userId, eventId) => {
  const rows = await query('SELECT id, status FROM registrations WHERE user_id = ? AND event_id = ?', [
    userId,
    eventId,
  ]);
  return rows[0];
};

