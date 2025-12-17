import * as EventModel from '../models/Event.js';
import { countRegistrationsByEvent } from '../models/Registration.js';

export const listEvents = async (req, res, next) => {
  try {
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const reviewStatus = req.query.reviewStatus;
    
    // 如果是活动发布者查看，只显示自己创建的活动
    const creatorId = req.user && req.user.role === 'organizer' ? req.user.id : undefined;
    
    // 如果是学生或未登录用户，只显示已审核通过的活动
    const onlyApproved = !req.user || req.user.role === 'student';
    
    const events = await EventModel.getEvents({ status, creatorId, reviewStatus, onlyApproved });

    const enriched = await Promise.all(
      events.map(async (event) => {
        const current = await countRegistrationsByEvent(event.id);
        return { ...event, currentCount: current };
      })
    );

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

export const getEventDetail = async (req, res, next) => {
  try {
    const event = await EventModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '未找到该活动' });
    }
    
    // 如果是学生或未登录用户，只能查看已审核通过的活动
    if (!req.user || req.user.role === 'student') {
      if (event.reviewStatus !== 'approved') {
        return res.status(403).json({ message: '该活动尚未通过审核，暂不可查看' });
      }
    }
    
    const current = await countRegistrationsByEvent(event.id);
    res.json({ ...event, currentCount: current });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    // 检查用户是否已登录且是活动发布者
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: '未登录或用户信息无效' });
    }
    
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ message: '仅活动发布者可创建活动' });
    }

    const requiredFields = ['title', 'startTime', 'endTime', 'place', 'limit'];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length) {
      return res.status(400).json({ message: `缺少必要字段：${missing.join(', ')}` });
    }

    // 将日期转换为完整的日期时间格式
    // 如果只提供了日期（YYYY-MM-DD），则添加时间部分
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    
    // 检查是否为日期格式（YYYY-MM-DD），如果是则添加时间
    if (startTime && /^\d{4}-\d{2}-\d{2}$/.test(startTime)) {
      startTime = `${startTime} 00:00:00`;
    }
    if (endTime && /^\d{4}-\d{2}-\d{2}$/.test(endTime)) {
      endTime = `${endTime} 23:59:59`;
    }

    // 从当前登录用户获取创建者 ID
    const creatorId = req.user.id;
    
    // 再次确认 creatorId 存在且有效（必须是正整数）
    if (!creatorId) {
      return res.status(400).json({ message: '无法获取用户 ID，请重新登录' });
    }
    
    const numericCreatorId = Number(creatorId);
    if (isNaN(numericCreatorId) || numericCreatorId <= 0 || !Number.isInteger(numericCreatorId)) {
      return res.status(400).json({ message: '用户 ID 无效，请重新登录' });
    }
    
    // 新创建的活动默认状态为待审核
    const event = await EventModel.createEvent({ ...req.body, startTime, endTime, creatorId: numericCreatorId });
    res.status(201).json(event);
  } catch (error) {
    console.error('创建活动错误:', {
      error: error.message,
      stack: error.stack,
      body: req.body,
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
    });
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const event = await EventModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '未找到该活动' });
    }

    // 检查权限：活动发布者只能编辑自己创建的活动
    if (req.user.role === 'organizer' && event.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权编辑此活动，只能编辑自己创建的活动' });
    }

    // 处理日期格式转换
    const updateData = { ...req.body };
    if (updateData.startTime && /^\d{4}-\d{2}-\d{2}$/.test(updateData.startTime)) {
      updateData.startTime = `${updateData.startTime} 00:00:00`;
    }
    if (updateData.endTime && /^\d{4}-\d{2}-\d{2}$/.test(updateData.endTime)) {
      updateData.endTime = `${updateData.endTime} 23:59:59`;
    }

    const updated = await EventModel.updateEvent(req.params.id, updateData);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (status === undefined) {
      return res.status(400).json({ message: '缺少状态字段' });
    }

    const event = await EventModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '未找到该活动' });
    }

    // 检查权限：活动发布者只能修改自己创建的活动状态
    if (req.user.role === 'organizer' && event.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权修改此活动状态，只能修改自己创建的活动' });
    }

    const updated = await EventModel.updateEvent(req.params.id, { status });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const removeEvent = async (req, res, next) => {
  try {
    const event = await EventModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '未找到该活动' });
    }

    // 检查权限：活动发布者只能删除自己创建的活动
    if (req.user.role === 'organizer' && event.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权删除此活动，只能删除自己创建的活动' });
    }

    await EventModel.deleteEvent(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// 审核活动
export const reviewEvent = async (req, res, next) => {
  try {
    const { reviewStatus } = req.body;
    if (!reviewStatus || !['approved', 'rejected'].includes(reviewStatus)) {
      return res.status(400).json({ message: '审核状态无效，必须是 approved 或 rejected' });
    }

    const event = await EventModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: '未找到该活动' });
    }

    // 只有审核管理员可以审核活动
    if (req.user.role !== 'reviewer') {
      return res.status(403).json({ message: '仅审核管理员可审核活动' });
    }

    // 更新审核状态
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const updated = await EventModel.updateEvent(req.params.id, {
      reviewStatus,
      reviewTime: now,
      reviewerId: req.user.id,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

