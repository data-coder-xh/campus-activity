import bcrypt from 'bcryptjs';
import * as UserModel from '../models/User.js';
import { signToken } from '../middlewares/auth.js';

export const register = async (req, res, next) => {
  try {
    const { username, password, name, studentId, phone, college, major } = req.body;
    if (!username || !password || !name || !studentId) {
      return res.status(400).json({ message: '请填写完整的账号、密码、姓名与学号' });
    }

    const existingUser = await UserModel.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({ message: '账号已存在，请更换用户名' });
    }

    const existingStudent = await UserModel.getUserByStudentId(studentId);
    if (existingStudent) {
      return res.status(409).json({ message: '该学号已注册，请直接登录' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await UserModel.createUser({
      username,
      passwordHash,
      role: 'student',
      name,
      studentId,
      phone,
      college,
      major,
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: '请输入账号与密码' });
    }

    const credential = await UserModel.getUserByUsername(username);
    if (!credential) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const isMatch = await bcrypt.compare(password, credential.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: '账号或密码错误' });
    }

    const user = await UserModel.getUserById(credential.id);
    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
};

