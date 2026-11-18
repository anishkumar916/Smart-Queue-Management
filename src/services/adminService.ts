import api from './api';

export interface AdminStats {
  totalCustomers: number;
  activeQueues: number;
  activeStaff: number;
  totalServices: number;
  totalBranches: number;
  tokensToday: number;
  completedToday: number;
  averageWaitingTime: number;
}

export interface AnalyticsData {
  totalTokens: number;
  completedCount: number;
  cancelledCount: number;
  skippedCount: number;
  waitingCount: number;
  avgWaitingTime: number;
  avgServiceTime: number;
  peakHour: string;
  hourlyData: { hour: string; tokens: number; completed: number }[];
  serviceDemand: { name: string; tokens: number }[];
  counterLoad: { counterNumber: string; name: string; processed: number }[];
  insights: string[];
}

export const adminService = {
  getDashboardStats: async () => {
    return await api.get<{ success: boolean; stats: AdminStats }>('/api/admin/dashboard');
  },

  getAnalytics: async (branchId?: string) => {
    const url = branchId ? `/api/admin/analytics?branchId=${branchId}` : '/api/admin/analytics';
    return await api.get<{ success: boolean; analytics: AnalyticsData }>(url);
  },

  getUsers: async (role?: string) => {
    const url = role ? `/api/admin/users?role=${role}` : '/api/admin/users';
    return await api.get<{ success: boolean; users: any[] }>(url);
  },

  updateUser: async (id: string, data: any) => {
    return await api.put<{ success: boolean; user: any }>(`/api/admin/users/${id}`, data);
  },

  getSettings: async (branchId: string) => {
    return await api.get<{ success: boolean; settings: any }>(`/api/admin/settings/${branchId}`);
  },

  updateSettings: async (branchId: string, data: any) => {
    return await api.put<{ success: boolean; settings: any }>(`/api/admin/settings/${branchId}`, data);
  },

  // Organizations
  getOrganizations: async () => {
    return await api.get<{ success: boolean; organizations: any[] }>('/api/organizations');
  },
  createOrganization: async (data: any) => {
    return await api.post<{ success: boolean; organization: any }>('/api/organizations', data);
  },
  updateOrganization: async (id: string, data: any) => {
    return await api.put<{ success: boolean; organization: any }>(`/api/organizations/${id}`, data);
  },
  deleteOrganization: async (id: string) => {
    return await api.delete(`/api/organizations/${id}`);
  },

  // Branches
  getBranches: async (orgId?: string) => {
    const url = orgId ? `/api/branches?organizationId=${orgId}` : '/api/branches';
    return await api.get<{ success: boolean; branches: any[] }>(url);
  },
  getBranchById: async (id: string) => {
    return await api.get<{ success: boolean; branch: any }>(`/api/branches/${id}`);
  },
  createBranch: async (data: any) => {
    return await api.post<{ success: boolean; branch: any }>('/api/branches', data);
  },
  updateBranch: async (id: string, data: any) => {
    return await api.put<{ success: boolean; branch: any }>(`/api/branches/${id}`, data);
  },
  deleteBranch: async (id: string) => {
    return await api.delete(`/api/branches/${id}`);
  },

  // Services
  getServices: async (branchId?: string) => {
    const url = branchId ? `/api/services?branchId=${branchId}` : '/api/services';
    return await api.get<{ success: boolean; services: any[] }>(url);
  },
  createService: async (data: any) => {
    return await api.post<{ success: boolean; service: any }>('/api/services', data);
  },
  updateService: async (id: string, data: any) => {
    return await api.put<{ success: boolean; service: any }>(`/api/services/${id}`, data);
  },
  deleteService: async (id: string) => {
    return await api.delete(`/api/services/${id}`);
  },

  // Counters
  getCounters: async (branchId?: string) => {
    const url = branchId ? `/api/counters?branchId=${branchId}` : '/api/counters';
    return await api.get<{ success: boolean; counters: any[] }>(url);
  },
  createCounter: async (data: any) => {
    return await api.post<{ success: boolean; counter: any }>('/api/counters', data);
  },
  updateCounter: async (id: string, data: any) => {
    return await api.put<{ success: boolean; counter: any }>(`/api/counters/${id}`, data);
  },
  toggleCounterActive: async (id: string) => {
    return await api.patch<{ success: boolean; counter: any }>(`/api/counters/${id}/toggle-active`);
  }
};
