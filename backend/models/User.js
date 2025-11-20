import { query } from './db.js';

const safeFields =
  'id, username, role, name, student_id AS studentId, phone, major, create_time AS createTime';
const credentialFields = 'id, username, password_hash AS passwordHash, role';

export const getUserById = async (id) => {
  const rows = await query(`SELECT ${safeFields} FROM users WHERE id = ?`, [id]);
  return rows[0];
};

export const getUserByStudentId = async (studentId) => {
  const rows = await query(`SELECT ${safeFields} FROM users WHERE student_id = ?`, [studentId]);
  return rows[0];
};

export const getUserByUsername = async (username) => {
  const rows = await query(`SELECT ${credentialFields} FROM users WHERE username = ?`, [username]);
  return rows[0];
};

export const createUser = async ({ username, passwordHash, role = 'student', name, studentId, phone, major }) => {
  const sql =
    'INSERT INTO users (username, password_hash, role, name, student_id, phone, major) VALUES (?, ?, ?, ?, ?, ?, ?)';
  const result = await query(sql, [username, passwordHash, role, name, studentId, phone || '', major || '']);
  return getUserById(result.insertId);
};

export const updateUser = async (id, payload) => {
  const fields = [];
  const params = [];

  const mappings = {
    name: 'name',
    studentId: 'student_id',
    phone: 'phone',
    major: 'major',
  };

  Object.entries(mappings).forEach(([key, column]) => {
    if (payload[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(payload[key]);
    }
  });

  if (!fields.length) return getUserById(id);

  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
  params.push(id);
  await query(sql, params);
  return getUserById(id);
};

export const updatePasswordHash = async (id, passwordHash) => {
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  return getUserById(id);
};

