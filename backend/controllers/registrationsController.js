import * as RegistrationModel from '../models/Registration.js';
import * as EventModel from '../models/Event.js';

export const listRegistrations = async (req, res, next) => {
  try {
    const { userId, eventId, status } = req.query;
    const filters = {
      userId: req.user.role === 'admin' ? userId : req.user.id,
      eventId,
      status: status !== undefined ? Number(status) : undefined,
    };
    const registrations = await RegistrationModel.getRegistrations(filters);
    res.json(registrations);
  } catch (error) {
    next(error);
  }
};

export const createRegistration = async (req, res, next) => {
  try {
    const { eventId, remark } = req.body;

    if (!eventId) {
      return res.status(400).json({ message: '活动信息不能为空' });
    }

    const event = await EventModel.getEventById(eventId);
    if (!event || event.status === 0) {
      return res.status(400).json({ message: '该活动不可报名' });
    }

    const parseList = (value) =>
      String(value || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

    const allowedColleges = parseList(event.allowedColleges);
    const allowedGrades = parseList(event.allowedGrades);

    if (allowedColleges.length > 0) {
      const userCollege = (req.user.college || '').trim();
      if (!userCollege || !allowedColleges.includes(userCollege)) {
        return res.status(403).json({ message: '不符合活动报名资格（学院限制）' });
      }
    }

    if (allowedGrades.length > 0) {
      const studentId = String(req.user.studentId || '');
      const gradeMatch = studentId.match(/^(\d{4})/);
      const userGrade = gradeMatch ? gradeMatch[1] : '';
      if (!userGrade || !allowedGrades.includes(userGrade)) {
        return res.status(403).json({ message: '不符合活动报名资格（年级限制）' });
      }
    }

    const existing = await RegistrationModel.findExisting(req.user.id, eventId);
    if (existing && existing.status !== 2) {
      return res.status(409).json({ message: '已提交报名，请勿重复报名' });
    }

    const current = await RegistrationModel.countRegistrationsByEvent(eventId);
    if (current >= event.limit) {
      return res.status(400).json({ message: '报名人数已满' });
    }

    const registration = await RegistrationModel.createRegistration({
      userId: req.user.id,
      eventId,
      remark,
    });
    res.status(201).json(registration);
  } catch (error) {
    next(error);
  }
};

export const updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (![0, 1, 2].includes(Number(status))) {
      return res.status(400).json({ message: '无效的状态值' });
    }

    const current = await RegistrationModel.getRegistrationById(req.params.id);
    if (!current) {
      return res.status(404).json({ message: '报名记录不存在' });
    }

    const updated = await RegistrationModel.updateRegistrationStatus(req.params.id, Number(status));
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
