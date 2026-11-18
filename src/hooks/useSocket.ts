import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export function useSocket(events?: {
  branchId?: string;
  userId?: string;
  tokenNumber?: string;
  onQueueUpdated?: (data: any) => void;
  onTokenCalled?: (data: any) => void;
  onServiceStarted?: (data: any) => void;
  onServiceCompleted?: (data: any) => void;
  onTokenSkipped?: (data: any) => void;
  onNotification?: (data: any) => void;
}) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socketUrl =
      (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '') || window.location.origin;

    // Connect to configured backend URL or same host/port
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (events?.branchId) {
        socket.emit('joinBranch', events.branchId);
      }
      if (events?.userId) {
        socket.emit('joinUser', events.userId);
      }
      if (events?.tokenNumber) {
        socket.emit('joinToken', events.tokenNumber);
      }
    });

    if (events?.onQueueUpdated) {
      socket.on('queueUpdated', events.onQueueUpdated);
      socket.on('globalQueueUpdated', events.onQueueUpdated);
    }

    if (events?.onTokenCalled) {
      socket.on('tokenCalled', events.onTokenCalled);
    }

    if (events?.onServiceStarted) {
      socket.on('serviceStarted', events.onServiceStarted);
    }

    if (events?.onServiceCompleted) {
      socket.on('serviceCompleted', events.onServiceCompleted);
    }

    if (events?.onTokenSkipped) {
      socket.on('tokenSkipped', events.onTokenSkipped);
    }

    if (events?.onNotification) {
      socket.on('notificationCreated', events.onNotification);
    }

    return () => {
      socket.disconnect();
    };
  }, [events?.branchId, events?.userId, events?.tokenNumber]);

  return socketRef.current;
}
