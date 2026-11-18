import { Server as SocketIOServer } from 'socket.io';

let ioInstance: SocketIOServer | null = null;

export function initSocketIO(io: SocketIOServer) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join branch room for live queue updates
    socket.on('joinBranch', (branchId: string) => {
      if (branchId) {
        socket.join(`branch_${branchId}`);
      }
    });

    socket.on('leaveBranch', (branchId: string) => {
      if (branchId) {
        socket.leave(`branch_${branchId}`);
      }
    });

    // Join user room for targeted notifications
    socket.on('joinUser', (userId: string) => {
      if (userId) {
        socket.join(`user_${userId}`);
      }
    });

    // Join token tracking room
    socket.on('joinToken', (tokenNumber: string) => {
      if (tokenNumber) {
        socket.join(`token_${tokenNumber}`);
      }
    });
  });

  return ioInstance;
}

export function getIO(): SocketIOServer | null {
  return ioInstance;
}

export function broadcastQueueUpdate(branchId: string, data: any) {
  if (!ioInstance) return;
  ioInstance.to(`branch_${branchId}`).emit('queueUpdated', data);
  ioInstance.emit('globalQueueUpdated', { branchId, ...data });
}

export function emitTokenCalled(branchId: string, token: any) {
  if (!ioInstance) return;
  ioInstance.to(`branch_${branchId}`).emit('tokenCalled', token);
  if (token.tokenNumber) {
    ioInstance.to(`token_${token.tokenNumber}`).emit('tokenCalled', token);
  }
  if (token.customerId) {
    ioInstance.to(`user_${token.customerId}`).emit('tokenCalled', token);
  }
}

export function emitServiceStarted(branchId: string, token: any) {
  if (!ioInstance) return;
  ioInstance.to(`branch_${branchId}`).emit('serviceStarted', token);
  if (token.tokenNumber) {
    ioInstance.to(`token_${token.tokenNumber}`).emit('serviceStarted', token);
  }
  if (token.customerId) {
    ioInstance.to(`user_${token.customerId}`).emit('serviceStarted', token);
  }
}

export function emitServiceCompleted(branchId: string, token: any) {
  if (!ioInstance) return;
  ioInstance.to(`branch_${branchId}`).emit('serviceCompleted', token);
  if (token.tokenNumber) {
    ioInstance.to(`token_${token.tokenNumber}`).emit('serviceCompleted', token);
  }
  if (token.customerId) {
    ioInstance.to(`user_${token.customerId}`).emit('serviceCompleted', token);
  }
}

export function emitTokenSkipped(branchId: string, token: any) {
  if (!ioInstance) return;
  ioInstance.to(`branch_${branchId}`).emit('tokenSkipped', token);
  if (token.tokenNumber) {
    ioInstance.to(`token_${token.tokenNumber}`).emit('tokenSkipped', token);
  }
}

export function emitUserNotification(userId: string, notification: any) {
  if (!ioInstance) return;
  ioInstance.to(`user_${userId}`).emit('notificationCreated', notification);
}
