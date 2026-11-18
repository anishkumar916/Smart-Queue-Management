import mongoose, { Schema } from 'mongoose';
import crypto from 'crypto';
import { isConnectedToMongo } from '../config/db';

// Types
export interface IUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  branchId?: string;
  counterId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IOrganization {
  _id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

export interface IBranch {
  _id: string;
  organizationId: string;
  name: string;
  address: string;
  isActive: boolean;
  openingTime: string;
  closingTime: string;
  createdAt: string;
}

export interface IService {
  _id: string;
  branchId: string;
  name: string;
  description: string;
  averageServiceTime: number; // in minutes
  priorityEnabled: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ICounter {
  _id: string;
  branchId: string;
  counterNumber: string;
  name: string;
  assignedStaffId?: string;
  isActive: boolean;
  currentTokenId?: string;
  createdAt: string;
}

export interface IToken {
  _id: string;
  tokenNumber: string;
  customerId: string;
  branchId: string;
  serviceId: string;
  counterId?: string;
  qrTokenId: string; // Cryptographically unique QR security identifier
  status: 'WAITING' | 'TOKEN_PRESENTED' | 'VERIFIED' | 'CALLED' | 'SERVING' | 'COMPLETED' | 'SKIPPED' | 'CANCELLED' | 'NO_SHOW';
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedByStaffId?: string;
  priority: 'NORMAL' | 'PRIORITY' | 'EMERGENCY';
  queuePosition: number;
  estimatedWaitTime: number; // in minutes
  createdAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  actualWaitTime?: number; // in minutes
  serviceDuration?: number; // in minutes
  staffRemarks?: string;
  emailedStages?: string[];
}

export interface INotification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface IServiceHistory {
  _id: string;
  tokenId: string;
  serviceId: string;
  branchId: string;
  staffId?: string;
  serviceDuration: number;
  waitingDuration: number;
  completedAt: string;
  staffRemarks?: string;
}

export interface IQueueSettings {
  _id: string;
  branchId: string;
  maxQueueSize: number;
  defaultServiceTime: number;
  priorityEnabled: boolean;
  notificationEnabled: boolean;
  tokenPrefix: string;
  updatedAt: string;
}

// In-Memory Collections storage
const memoryData: {
  users: IUser[];
  organizations: IOrganization[];
  branches: IBranch[];
  services: IService[];
  counters: ICounter[];
  tokens: IToken[];
  notifications: INotification[];
  serviceHistories: IServiceHistory[];
  queueSettings: IQueueSettings[];
} = {
  users: [],
  organizations: [],
  branches: [],
  services: [],
  counters: [],
  tokens: [],
  notifications: [],
  serviceHistories: [],
  queueSettings: []
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

// Memory Model Wrapper
export class MemoryCollection<T extends { _id: string }> {
  constructor(private collectionName: keyof typeof memoryData) {}

  private get items(): T[] {
    return (memoryData[this.collectionName] as unknown) as T[];
  }

  private set items(newItems: T[]) {
    (memoryData[this.collectionName] as any) = newItems;
  }

  private matchQuery(item: any, query: any): boolean {
    if (!query || Object.keys(query).length === 0) return true;
    for (const key of Object.keys(query)) {
      const val = query[key];
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        if ('$in' in val && Array.isArray(val.$in)) {
          if (!val.$in.includes(item[key])) return false;
        } else if ('$nin' in val && Array.isArray(val.$nin)) {
          if (val.$nin.includes(item[key])) return false;
        } else if ('$ne' in val) {
          if (item[key] === val.$ne) return false;
        } else if ('$gt' in val) {
          if (!(item[key] > val.$gt)) return false;
        } else if ('$gte' in val) {
          if (!(item[key] >= val.$gte)) return false;
        } else if ('$lt' in val) {
          if (!(item[key] < val.$lt)) return false;
        } else if ('$lte' in val) {
          if (!(item[key] <= val.$lte)) return false;
        }
      } else {
        if (item[key] !== val) return false;
      }
    }
    return true;
  }

  async find(query: any = {}): Promise<T[]> {
    return this.items.filter(item => this.matchQuery(item, query)).map(i => {
      if (this.collectionName === 'tokens' && !(i as any).qrTokenId) {
        (i as any).qrTokenId = crypto.randomUUID();
      }
      return { ...i };
    });
  }

  async findOne(query: any = {}): Promise<T | null> {
    const item = this.items.find(item => this.matchQuery(item, query));
    if (item && this.collectionName === 'tokens' && !(item as any).qrTokenId) {
      (item as any).qrTokenId = crypto.randomUUID();
    }
    return item ? { ...item } : null;
  }

  async findById(id: string): Promise<T | null> {
    const item = this.items.find(item => item._id === id);
    if (item && this.collectionName === 'tokens' && !(item as any).qrTokenId) {
      (item as any).qrTokenId = crypto.randomUUID();
    }
    return item ? { ...item } : null;
  }

  async create(data: Partial<T> | Partial<T>[]): Promise<any> {
    if (Array.isArray(data)) {
      const created = data.map(d => {
        const qrId = (d as any).qrTokenId || (this.collectionName === 'tokens' ? crypto.randomUUID() : undefined);
        if (this.collectionName === 'tokens' && qrId) {
          const duplicate = (this.items as any[]).find(it => it.qrTokenId === qrId);
          if (duplicate) {
            throw new Error(`Duplicate qrTokenId '${qrId}': token already exists with this QR identifier.`);
          }
        }
        return {
          _id: (d as any)._id || generateId(),
          createdAt: (d as any).createdAt || new Date().toISOString(),
          updatedAt: (d as any).updatedAt || new Date().toISOString(),
          ...(qrId ? { qrTokenId: qrId } : {}),
          ...d
        } as unknown as T;
      });
      this.items.push(...created);
      return created;
    }

    const qrId = (data as any).qrTokenId || (this.collectionName === 'tokens' ? crypto.randomUUID() : undefined);
    if (this.collectionName === 'tokens' && qrId) {
      const duplicate = (this.items as any[]).find(it => it.qrTokenId === qrId);
      if (duplicate) {
        throw new Error(`Duplicate qrTokenId '${qrId}': token already exists with this QR identifier.`);
      }
    }

    const doc: any = {
      _id: (data as any)._id || generateId(),
      createdAt: (data as any).createdAt || new Date().toISOString(),
      updatedAt: (data as any).updatedAt || new Date().toISOString(),
      ...(qrId ? { qrTokenId: qrId } : {}),
      ...data
    };
    this.items.push(doc);
    return { ...doc };
  }

  async findByIdAndUpdate(id: string, update: any, options: { new?: boolean } = { new: true }): Promise<T | null> {
    const idx = this.items.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const current = this.items[idx];
    const updated = {
      ...current,
      ...update,
      updatedAt: new Date().toISOString()
    };
    this.items[idx] = updated;
    return options.new ? { ...updated } : { ...current };
  }

  async updateOne(query: any, update: any): Promise<{ modifiedCount: number }> {
    const idx = this.items.findIndex(item => this.matchQuery(item, query));
    if (idx === -1) return { modifiedCount: 0 };
    this.items[idx] = {
      ...this.items[idx],
      ...update,
      updatedAt: new Date().toISOString()
    };
    return { modifiedCount: 1 };
  }

  async updateMany(query: any, update: any): Promise<{ modifiedCount: number }> {
    let count = 0;
    this.items = this.items.map(item => {
      if (this.matchQuery(item, query)) {
        count++;
        return {
          ...item,
          ...update,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });
    return { modifiedCount: count };
  }

  async deleteOne(query: any): Promise<{ deletedCount: number }> {
    const idx = this.items.findIndex(item => this.matchQuery(item, query));
    if (idx === -1) return { deletedCount: 0 };
    this.items.splice(idx, 1);
    return { deletedCount: 1 };
  }

  async findByIdAndDelete(id: string): Promise<T | null> {
    const idx = this.items.findIndex(item => item._id === id);
    if (idx === -1) return null;
    const deleted = this.items.splice(idx, 1)[0];
    return deleted;
  }

  async deleteMany(query: any = {}): Promise<{ deletedCount: number }> {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => !this.matchQuery(item, query));
    return { deletedCount: initialLen - this.items.length };
  }

  async countDocuments(query: any = {}): Promise<number> {
    return this.items.filter(item => this.matchQuery(item, query)).length;
  }
}

// In-Memory Collections
export const MemoryUser = new MemoryCollection<IUser>('users');
export const MemoryOrganization = new MemoryCollection<IOrganization>('organizations');
export const MemoryBranch = new MemoryCollection<IBranch>('branches');
export const MemoryService = new MemoryCollection<IService>('services');
export const MemoryCounter = new MemoryCollection<ICounter>('counters');
export const MemoryToken = new MemoryCollection<IToken>('tokens');
export const MemoryNotification = new MemoryCollection<INotification>('notifications');
export const MemoryServiceHistory = new MemoryCollection<IServiceHistory>('serviceHistories');
export const MemoryQueueSettings = new MemoryCollection<IQueueSettings>('queueSettings');

// Mongoose Models
const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['CUSTOMER', 'STAFF', 'ADMIN'], default: 'CUSTOMER' },
  isActive: { type: Boolean, default: true },
  branchId: { type: String },
  counterId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  description: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const BranchSchema = new Schema<IBranch>({
  organizationId: { type: String, required: true },
  name: { type: String, required: true },
  address: { type: String },
  isActive: { type: Boolean, default: true },
  openingTime: { type: String, default: '09:00' },
  closingTime: { type: String, default: '17:00' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ServiceSchema = new Schema<IService>({
  branchId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  averageServiceTime: { type: Number, default: 10 },
  priorityEnabled: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const CounterSchema = new Schema<ICounter>({
  branchId: { type: String, required: true },
  counterNumber: { type: String, required: true },
  name: { type: String, required: true },
  assignedStaffId: { type: String },
  isActive: { type: Boolean, default: true },
  currentTokenId: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const TokenSchema = new Schema<IToken>({
  tokenNumber: { type: String, required: true },
  customerId: { type: String, required: true },
  branchId: { type: String, required: true },
  serviceId: { type: String, required: true },
  counterId: { type: String },
  qrTokenId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['WAITING', 'TOKEN_PRESENTED', 'VERIFIED', 'CALLED', 'SERVING', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW'],
    default: 'WAITING'
  },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: String },
  verifiedByStaffId: { type: String },
  priority: {
    type: String,
    enum: ['NORMAL', 'PRIORITY', 'EMERGENCY'],
    default: 'NORMAL'
  },
  queuePosition: { type: Number, default: 1 },
  estimatedWaitTime: { type: Number, default: 10 },
  createdAt: { type: String, default: () => new Date().toISOString() },
  calledAt: { type: String },
  serviceStartedAt: { type: String },
  completedAt: { type: String },
  cancelledAt: { type: String },
  actualWaitTime: { type: Number },
  serviceDuration: { type: Number },
  staffRemarks: { type: String },
  emailedStages: { type: [String], default: [] }
});

const NotificationSchema = new Schema<INotification>({
  userId: { type: String, required: true },
  type: { type: String, default: 'INFO' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ServiceHistorySchema = new Schema<IServiceHistory>({
  tokenId: { type: String, required: true },
  serviceId: { type: String, required: true },
  branchId: { type: String, required: true },
  staffId: { type: String },
  serviceDuration: { type: Number, required: true },
  waitingDuration: { type: Number, required: true },
  completedAt: { type: String, default: () => new Date().toISOString() },
  staffRemarks: { type: String }
});

const QueueSettingsSchema = new Schema<IQueueSettings>({
  branchId: { type: String, required: true },
  maxQueueSize: { type: Number, default: 100 },
  defaultServiceTime: { type: Number, default: 10 },
  priorityEnabled: { type: Boolean, default: true },
  notificationEnabled: { type: Boolean, default: true },
  tokenPrefix: { type: String, default: 'T' },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

// Guarded Mongoose model instantiation
const MongoUserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
const MongoOrgModel = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);
const MongoBranchModel = mongoose.models.Branch || mongoose.model<IBranch>('Branch', BranchSchema);
const MongoServiceModel = mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);
const MongoCounterModel = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);
const MongoTokenModel = mongoose.models.Token || mongoose.model<IToken>('Token', TokenSchema);
const MongoNotifModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
const MongoHistoryModel = mongoose.models.ServiceHistory || mongoose.model<IServiceHistory>('ServiceHistory', ServiceHistorySchema);
const MongoSettingsModel = mongoose.models.QueueSettings || mongoose.model<IQueueSettings>('QueueSettings', QueueSettingsSchema);

// Hybrid model proxy that resolves to Mongoose if connected or In-Memory store if not
export function getModel<T extends { _id: string }>(
  memoryColl: MemoryCollection<T>,
  mongoModel: mongoose.Model<any>
) {
  return new Proxy({} as any, {
    get(_target, prop) {
      if (isConnectedToMongo) {
        return (mongoModel as any)[prop]?.bind(mongoModel);
      }
      return (memoryColl as any)[prop]?.bind(memoryColl);
    }
  });
}

// Exported Data Models used across the entire backend
export const UserModel = getModel<IUser>(MemoryUser, MongoUserModel);
export const OrganizationModel = getModel<IOrganization>(MemoryOrganization, MongoOrgModel);
export const BranchModel = getModel<IBranch>(MemoryBranch, MongoBranchModel);
export const ServiceModel = getModel<IService>(MemoryService, MongoServiceModel);
export const CounterModel = getModel<ICounter>(MemoryCounter, MongoCounterModel);
export const TokenModel = getModel<IToken>(MemoryToken, MongoTokenModel);
export const NotificationModel = getModel<INotification>(MemoryNotification, MongoNotifModel);
export const ServiceHistoryModel = getModel<IServiceHistory>(MemoryServiceHistory, MongoHistoryModel);
export const QueueSettingsModel = getModel<IQueueSettings>(MemoryQueueSettings, MongoSettingsModel);
