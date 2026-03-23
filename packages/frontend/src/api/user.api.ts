import api from './axios';
import type { User } from '../types';

export const userApi = {
  getProfile: () =>
    api.get<User>('/user/profile'),

  findAll: () =>
    api.get<User[]>('/user'),
};
