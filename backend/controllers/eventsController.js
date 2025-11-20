import * as EventModel from '../models/Event.js';
import { countRegistrationsByEvent } from '../models/Registration.js';

export const listEvents = async (req, res, next) => {
  try {
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    // 如果是管理员查看，默认只显示自己创建的活动
    const creatorId = req.user && req.user.role === 'admin' ? req.user.id : undefined;
    const events = await EventModel.getEvents({ status, creatorId });

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
    const current = await countRegistrationsByEvent(event.id);
    res.json({ ...event, currentCount: current });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    // 检查用户是否已登录
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: '未登录或用户信息无效' });
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

    // 检查权限：只能编辑自己创建的活动
    if (event.creatorId !== req.user.id) {
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

    // 检查权限：只能修改自己创建的活动状态
    if (event.creatorId !== req.user.id) {
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

    // 检查权限：只能删除自己创建的活动
    if (event.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权删除此活动，只能删除自己创建的活动' });
    }

    await EventModel.deleteEvent(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

