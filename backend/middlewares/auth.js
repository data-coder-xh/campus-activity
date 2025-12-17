import jwt from 'jsonwebtoken';
import * as UserModel from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'campus-activity-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [, token] = authHeader.split(' ');
    if (!token) {
      return res.status(401).json({ message: '未登录或令牌缺失' });
    }
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await UserModel.getUserById(payload.sub || payload.id);
    if (!user) {
      return res.status(401).json({ message: '用户不存在或已被删除' });
    }
    req.user = user;
    next();
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? '登录状态已过期，请重新登录' : '令牌无效';
    res.status(401).json({ message });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: '仅管理员可执行此操作' });
  }
  next();
};

export const requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录' });
  }
  if (req.user.role !== 'organizer') {
    return res.status(403).json({ message: '仅活动发布者可执行此操作' });
  }
  next();
};

export const requireReviewer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录' });
  }
  if (req.user.role !== 'reviewer') {
    return res.status(403).json({ message: '仅审核管理员可执行此操作' });
  }
  next();
};

export const requireOrganizerOrReviewer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: '未登录' });
  }
  if (req.user.role !== 'organizer' && req.user.role !== 'reviewer') {
    return res.status(403).json({ message: '仅活动发布者或审核管理员可执行此操作' });
  }
  next();
};

