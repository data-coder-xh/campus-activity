import * as EventModel from '../models/Event.js';
import { countRegistrationsByEvent } from '../models/Registration.js';

export const listEvents = async (req, res, next) => {
  try {
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const events = await EventModel.getEvents({ status });

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

    const event = await EventModel.createEvent(req.body);
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

    const event = await EventModel.updateEvent(req.params.id, { status });
    res.json(event);
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
    await EventModel.deleteEvent(req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

