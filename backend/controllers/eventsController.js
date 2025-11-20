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
    const requiredFields = ['title', 'startTime', 'endTime', 'place', 'limit'];
    const missing = requiredFields.filter((field) => !req.body[field]);

    if (missing.length) {
      return res.status(400).json({ message: `缺少必要字段：${missing.join(', ')}` });
    }

    // 从当前登录用户获取创建者 ID
    const creatorId = req.user.id;
    const event = await EventModel.createEvent({ ...req.body, creatorId });
    res.status(201).json(event);
  } catch (error) {
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

    const updated = await EventModel.updateEvent(req.params.id, req.body);
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

