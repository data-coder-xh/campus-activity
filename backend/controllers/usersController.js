import * as UserModel from '../models/User.js';

export const getCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await UserModel.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateCurrentUserProfile = async (req, res, next) => {
  try {
    const user = await UserModel.updateUser(req.user.id, req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

