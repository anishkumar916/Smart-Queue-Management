import api from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  branchId?: string;
  counterId?: string;
  createdAt?: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const data = await api.post<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      email,
      password
    });
    if (data.token) {
      localStorage.setItem('sq_token', data.token);
    }
    return data;
  },

  register: async (params: {
    name: string;
    email: string;
    phone?: string;
    password: string;
    role?: string;
    branchId?: string;
    counterId?: string;
  }) => {
    const data = await api.post<{ success: boolean; token: string; user: User }>('/api/auth/register', params);
    if (data.token) {
      localStorage.setItem('sq_token', data.token);
    }
    return data;
  },

  getMe: async () => {
    return await api.get<{ success: boolean; user: User }>('/api/auth/me');
  },

  logout: () => {
    localStorage.removeItem('sq_token');
  }
};
