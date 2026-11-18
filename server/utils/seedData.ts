import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { UserModel } from '../models/User';
import { OrganizationModel } from '../models/Organization';
import { BranchModel } from '../models/Branch';
import { ServiceModel } from '../models/Service';
import { CounterModel } from '../models/Counter';
import { TokenModel } from '../models/Token';
import { ServiceHistoryModel } from '../models/ServiceHistory';
import { QueueSettingsModel } from '../models/QueueSettings';
import { NotificationModel } from '../models/Notification';

export async function seedDatabase() {
  const existingUsers = await UserModel.find();
  if (existingUsers && existingUsers.length > 0) {
    console.log('[Seeder] Database already populated with users, skipping seed.');
    return;
  }

  console.log('[Seeder] Seeding initial database with organizations, branches, counters, staff, and tokens...');

  const defaultPassword = process.env.DEMO_USER_PASSWORD || 'Password@123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  // 1. Organization
  const org = await OrganizationModel.create({
    name: 'Apex Health & Public Services',
    description: 'Premier Multi-Specialty Clinic & Citizen Services Authority',
    address: '742 Evergreen Avenue, Metropolis',
    phone: '+1 (555) 019-2834',
    email: 'contact@apexservices.org',
    isActive: true
  });

  // 2. Branches
  const branchCentral = await BranchModel.create({
    organizationId: org._id,
    name: 'Metropolis Central Branch',
    address: '100 Financial District Blvd',
    isActive: true,
    openingTime: '08:00',
    closingTime: '18:00'
  });

  const branchWest = await BranchModel.create({
    organizationId: org._id,
    name: 'Westside Healthcare & Civic Hub',
    address: '450 Western Gateway Park',
    isActive: true,
    openingTime: '09:00',
    closingTime: '17:00'
  });

  // 3. Queue Settings
  await QueueSettingsModel.create({
    branchId: branchCentral._id,
    maxQueueSize: 200,
    defaultServiceTime: 8,
    priorityEnabled: true,
    notificationEnabled: true,
    tokenPrefix: 'C'
  });

  await QueueSettingsModel.create({
    branchId: branchWest._id,
    maxQueueSize: 150,
    defaultServiceTime: 10,
    priorityEnabled: true,
    notificationEnabled: true,
    tokenPrefix: 'W'
  });

  // 4. Admin User
  const adminUser = await UserModel.create({
    name: 'Admin Chief Officer',
    email: 'admin@queue.com',
    phone: '+1 555-0100',
    password: hashedPassword,
    role: 'ADMIN',
    isActive: true
  });

  // 5. Staff Users
  const staff1 = await UserModel.create({
    name: 'Sarah Jenkins (Counter 1)',
    email: 'staff1@queue.com',
    phone: '+1 555-0101',
    password: hashedPassword,
    role: 'STAFF',
    branchId: branchCentral._id,
    isActive: true
  });

  const staff2 = await UserModel.create({
    name: 'David Rodriguez (Counter 2)',
    email: 'staff2@queue.com',
    phone: '+1 555-0102',
    password: hashedPassword,
    role: 'STAFF',
    branchId: branchCentral._id,
    isActive: true
  });

  // 6. 10 Customers
  const customerNames = [
    { name: 'Alex Henderson', email: 'alex@example.com' },
    { name: 'Beatrice Vance', email: 'beatrice@example.com' },
    { name: 'Charles Montgomery', email: 'charles@example.com' },
    { name: 'Diana Prince', email: 'diana@example.com' },
    { name: 'Ethan Hunt', email: 'ethan@example.com' },
    { name: 'Fiona Gallagher', email: 'fiona@example.com' },
    { name: 'George Clark', email: 'george@example.com' },
    { name: 'Hannah Abbott', email: 'hannah@example.com' },
    { name: 'Ian Malcolm', email: 'ian@example.com' },
    { name: 'Julia Roberts', email: 'customer@queue.com' } // primary demo customer
  ];

  const customers: any[] = [];
  for (const c of customerNames) {
    const cust = await UserModel.create({
      name: c.name,
      email: c.email,
      phone: '+1 555-0200',
      password: hashedPassword,
      role: 'CUSTOMER',
      isActive: true
    });
    customers.push(cust);
  }

  // 7. 5 Services (Central & West)
  const service1 = await ServiceModel.create({
    branchId: branchCentral._id,
    name: 'General Medical Consultation',
    description: 'Routine physician review, vital checks, and general assessment',
    averageServiceTime: 8,
    priorityEnabled: true,
    isActive: true
  });

  const service2 = await ServiceModel.create({
    branchId: branchCentral._id,
    name: 'Express Banking & Cashier',
    description: 'Deposits, withdrawals, drafts, and account updates',
    averageServiceTime: 5,
    priorityEnabled: false,
    isActive: true
  });

  const service3 = await ServiceModel.create({
    branchId: branchCentral._id,
    name: 'Citizen ID & Passport Verification',
    description: 'Document check, biometric capture, and notarization',
    averageServiceTime: 12,
    priorityEnabled: true,
    isActive: true
  });

  const service4 = await ServiceModel.create({
    branchId: branchCentral._id,
    name: 'Loan & Mortgages Consultation',
    description: 'Detailed financial eligibility and mortgage underwriting',
    averageServiceTime: 15,
    priorityEnabled: true,
    isActive: true
  });

  const service5 = await ServiceModel.create({
    branchId: branchWest._id,
    name: 'Pediatrics & Immunization',
    description: 'Child wellness checks and seasonal vaccines',
    averageServiceTime: 10,
    priorityEnabled: true,
    isActive: true
  });

  // 8. 5 Counters
  const counter1 = await CounterModel.create({
    branchId: branchCentral._id,
    counterNumber: '1',
    name: 'Consultation Desk A',
    assignedStaffId: staff1._id,
    isActive: true
  });

  const counter2 = await CounterModel.create({
    branchId: branchCentral._id,
    counterNumber: '2',
    name: 'Cashier & Express Window',
    assignedStaffId: staff2._id,
    isActive: true
  });

  const counter3 = await CounterModel.create({
    branchId: branchCentral._id,
    counterNumber: '3',
    name: 'Biometrics & Records Station',
    isActive: true
  });

  const counter4 = await CounterModel.create({
    branchId: branchCentral._id,
    counterNumber: '4',
    name: 'Priority & VIP Desk',
    isActive: true
  });

  const counter5 = await CounterModel.create({
    branchId: branchWest._id,
    counterNumber: '1',
    name: 'Pediatric Care Bay 1',
    isActive: true
  });

  // 9. Sample Completed Tokens and Service History
  const pastMinutesAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000).toISOString();

  // Completed Token 1
  const t1 = await TokenModel.create({
    tokenNumber: 'A001',
    customerId: customers[0]._id,
    branchId: branchCentral._id,
    serviceId: service1._id,
    counterId: counter1._id,
    qrTokenId: crypto.randomUUID(),
    status: 'COMPLETED',
    priority: 'NORMAL',
    queuePosition: 0,
    estimatedWaitTime: 8,
    actualWaitTime: 7,
    serviceDuration: 9,
    createdAt: pastMinutesAgo(90),
    calledAt: pastMinutesAgo(80),
    serviceStartedAt: pastMinutesAgo(78),
    completedAt: pastMinutesAgo(69)
  });

  await ServiceHistoryModel.create({
    tokenId: t1._id,
    serviceId: service1._id,
    branchId: branchCentral._id,
    staffId: staff1._id,
    serviceDuration: 9,
    waitingDuration: 7,
    completedAt: pastMinutesAgo(69)
  });

  // Completed Token 2
  const t2 = await TokenModel.create({
    tokenNumber: 'A002',
    customerId: customers[1]._id,
    branchId: branchCentral._id,
    serviceId: service2._id,
    counterId: counter2._id,
    qrTokenId: crypto.randomUUID(),
    status: 'COMPLETED',
    priority: 'NORMAL',
    queuePosition: 0,
    estimatedWaitTime: 5,
    actualWaitTime: 4,
    serviceDuration: 6,
    createdAt: pastMinutesAgo(75),
    calledAt: pastMinutesAgo(68),
    serviceStartedAt: pastMinutesAgo(66),
    completedAt: pastMinutesAgo(60)
  });

  await ServiceHistoryModel.create({
    tokenId: t2._id,
    serviceId: service2._id,
    branchId: branchCentral._id,
    staffId: staff2._id,
    serviceDuration: 6,
    waitingDuration: 4,
    completedAt: pastMinutesAgo(60)
  });

  // Serving Token
  const tServing = await TokenModel.create({
    tokenNumber: 'A003',
    customerId: customers[2]._id,
    branchId: branchCentral._id,
    serviceId: service1._id,
    counterId: counter1._id,
    qrTokenId: crypto.randomUUID(),
    status: 'SERVING',
    priority: 'NORMAL',
    queuePosition: 0,
    estimatedWaitTime: 8,
    actualWaitTime: 6,
    createdAt: pastMinutesAgo(35),
    calledAt: pastMinutesAgo(15),
    serviceStartedAt: pastMinutesAgo(10)
  });

  await CounterModel.findByIdAndUpdate(counter1._id, { currentTokenId: tServing._id });

  // Called Token
  const tCalled = await TokenModel.create({
    tokenNumber: 'A004',
    customerId: customers[3]._id,
    branchId: branchCentral._id,
    serviceId: service2._id,
    counterId: counter2._id,
    qrTokenId: crypto.randomUUID(),
    status: 'CALLED',
    priority: 'PRIORITY',
    queuePosition: 0,
    estimatedWaitTime: 6,
    createdAt: pastMinutesAgo(25),
    calledAt: pastMinutesAgo(2)
  });

  await CounterModel.findByIdAndUpdate(counter2._id, { currentTokenId: tCalled._id });

  // Waiting Tokens (Customer 4, 5, 6, and demo customer 9)
  await TokenModel.create({
    tokenNumber: 'A005',
    customerId: customers[4]._id,
    branchId: branchCentral._id,
    serviceId: service1._id,
    qrTokenId: crypto.randomUUID(),
    status: 'WAITING',
    priority: 'NORMAL',
    queuePosition: 1,
    estimatedWaitTime: 5,
    createdAt: pastMinutesAgo(20)
  });

  await TokenModel.create({
    tokenNumber: 'A006',
    customerId: customers[5]._id,
    branchId: branchCentral._id,
    serviceId: service3._id,
    qrTokenId: crypto.randomUUID(),
    status: 'WAITING',
    priority: 'NORMAL',
    queuePosition: 2,
    estimatedWaitTime: 11,
    createdAt: pastMinutesAgo(18)
  });

  // Demo user token: Julia Roberts
  await TokenModel.create({
    tokenNumber: 'A007',
    customerId: customers[9]._id, // customer@queue.com
    branchId: branchCentral._id,
    serviceId: service1._id,
    qrTokenId: crypto.randomUUID(),
    status: 'WAITING',
    priority: 'NORMAL',
    queuePosition: 3,
    estimatedWaitTime: 16,
    createdAt: pastMinutesAgo(10)
  });

  // Welcome notifications for demo customer
  await NotificationModel.create({
    userId: customers[9]._id,
    type: 'TOKEN_CREATED',
    title: 'Token A007 Generated',
    message: 'Welcome to Metropolis Central! Your token is A007. Position in line: 3. Estimated wait: ~16 mins.',
    isRead: false
  });

  console.log('[Seeder] Database seeding completed successfully.');
  console.log('[Seeder] Demo Credentials:');
  console.log('         - Admin: admin@queue.com / Password@123');
  console.log('         - Staff 1: staff1@queue.com / Password@123');
  console.log('         - Staff 2: staff2@queue.com / Password@123');
  console.log('         - Customer: customer@queue.com / Password@123');
}
