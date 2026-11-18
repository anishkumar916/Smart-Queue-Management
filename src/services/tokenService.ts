import api from './api';

export interface Token {
  _id: string;
  tokenNumber: string;
  customerId: string;
  branchId: string;
  serviceId: string;
  counterId?: string;
  qrTokenId: string;
  status: 'WAITING' | 'TOKEN_PRESENTED' | 'VERIFIED' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW';
  isVerified?: boolean;
  verifiedAt?: string;
  priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
  queuePosition: number;
  estimatedWaitTime: number;
  createdAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  actualWaitTime?: number;
  serviceDuration?: number;
  branchName?: string;
  serviceName?: string;
  counterName?: string;
  currentServingTokenNumber?: string;
  staffRemarks?: string;
}

export const tokenService = {
  joinQueue: async (branchId: string, serviceId: string, priority?: string) => {
    return await api.post<{ success: boolean; token: Token }>('/api/tokens', {
      branchId,
      serviceId,
      priority
    });
  },

  getMyTokens: async () => {
    return await api.get<{
      success: boolean;
      activeToken: Token | null;
      activeTokens: Token[];
      history: Token[];
    }>('/api/tokens/my');
  },

  getTokenById: async (id: string) => {
    return await api.get<{ success: boolean; token: Token }>(`/api/tokens/${id}`);
  },

  trackPublicToken: async (tokenNumber: string) => {
    return await api.get<{
      success: boolean;
      token: {
        _id: string;
        tokenNumber: string;
        status: string;
        queuePosition: number;
        estimatedWaitTime: number;
        priority: string;
        branchName: string;
        serviceName: string;
        counterName?: string;
        peopleAhead: number;
        currentServingToken: string;
        createdAt: string;
      };
    }>(`/api/tokens/track/${tokenNumber}`);
  },

  cancelToken: async (id: string) => {
    return await api.delete<{ success: boolean; message: string; token: Token }>(`/api/tokens/${id}`);
  }
};
