import api from './api';
import { Token } from './tokenService';

export interface QueuePrediction {
  estimatedWaitMinutes: number;
  peopleAhead: number;
  activeCounters: number;
  averageServiceTimeMinutes: number;
  queueVelocity: number;
  confidenceScore: number;
  explanation: string;
}

export interface QueueStatusResponse {
  success: boolean;
  branchId: string;
  waiting: Token[];
  called: (Token & { counterName?: string; serviceName?: string })[];
  serving: (Token & { counterName?: string; serviceName?: string })[];
  completedCount: number;
  activeCounters: number;
  totalWaiting: number;
}

export const queueService = {
  getBranchQueue: async (branchId: string) => {
    return await api.get<QueueStatusResponse>(`/api/queue/${branchId}`);
  },

  getQueueStatusBoard: async (branchId: string) => {
    return await api.get<{
      success: boolean;
      nowServing: string;
      next: string;
      waiting: string[];
      totalWaiting: number;
      activeCounters: number;
      servingList: any[];
      calledList: any[];
    }>(`/api/queue/${branchId}/status`);
  },

  getPrediction: async (branchId: string, serviceId?: string) => {
    const url = serviceId
      ? `/api/queue/${branchId}/prediction?serviceId=${serviceId}`
      : `/api/queue/${branchId}/prediction`;
    return await api.get<{ success: boolean; prediction: QueuePrediction }>(url);
  },

  callNext: async (branchId: string, counterId: string) => {
    return await api.post<{ success: boolean; message: string; token: Token }>('/api/queue/call-next', {
      branchId,
      counterId
    });
  },

  startService: async (tokenId: string) => {
    return await api.post<{ success: boolean; message: string; token: Token }>(`/api/queue/${tokenId}/start`);
  },

  completeService: async (tokenId: string, serviceRemarks?: string) => {
    return await api.post<{ success: boolean; message: string; token: Token }>(`/api/queue/${tokenId}/complete`, {
      serviceRemarks
    });
  },

  skipToken: async (tokenId: string, reason?: string) => {
    return await api.post<{ success: boolean; message: string; token: Token }>(`/api/queue/${tokenId}/skip`, { reason });
  },

  recallToken: async (tokenId: string, counterId: string) => {
    return await api.post<{ success: boolean; message: string; token: Token }>(`/api/queue/${tokenId}/recall`, { counterId });
  },

  scanQR: async (input: string | { qrTokenId?: string; qrData?: any; tokenId?: string; tokenNumber?: string; branchId?: string }, branchId?: string) => {
    const payload = typeof input === 'string'
      ? { qrData: input, branchId }
      : { ...input, branchId: input.branchId || branchId };
    return await api.post<{
      success: boolean;
      valid: boolean;
      canProcess?: boolean;
      status?: string;
      message: string;
      verification?: string;
      token?: Token;
      customer?: { name: string; phone: string };
      service?: { name: string };
      branch?: { name: string };
    }>('/api/queue/scan-qr', payload);
  }
};
