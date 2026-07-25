import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Task } from '../models/Task';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/navy-task-dashboard';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@navy.in';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([User.deleteMany({}), Department.deleteMany({}), Task.deleteMany({})]);
  console.log('Cleared existing data');

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const admin = await User.create({
    name: 'System Admin',
    email: ADMIN_EMAIL,
    passwordHash,
    role: 'admin',
    departmentId: null,
  });
  console.log(`Created admin: ${ADMIN_EMAIL}`);

  const departmentsData = [
    { name: 'Operations', code: 'OPS', description: 'Naval operations and mission planning' },
    { name: 'Logistics', code: 'LOG', description: 'Supply chain and resource management' },
    { name: 'Engineering', code: 'ENG', description: 'Ship maintenance and technical support' },
    { name: 'Medical', code: 'MED', description: 'Medical services and health readiness' },
    { name: 'Administration', code: 'ADM', description: 'Administrative and personnel affairs' },
  ];

  const departments = await Department.insertMany(departmentsData);
  console.log(`Created ${departments.length} departments`);

  const deptUsers = await Promise.all(
    departments.slice(0, 3).map(async (dept, index) => {
      const userPassword = await bcrypt.hash('dept123', 10);
      return User.create({
        name: `${dept.name} Officer`,
        email: `officer${index + 1}@navy.in`,
        passwordHash: userPassword,
        role: 'department_user',
        departmentId: dept._id,
      });
    })
  );
  console.log(`Created ${deptUsers.length} department users (password: dept123)`);

  const now = new Date();
  const daysAgo = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };
  const daysFromNow = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  };

  const tasksData = [
    {
      title: 'Quarterly readiness inspection',
      description: 'Conduct fleet readiness assessment for Q1',
      departmentId: departments[0]._id,
      assignedBy: admin._id,
      priority: 'high' as const,
      dueDate: daysFromNow(7),
      status: 'ongoing' as const,
    },
    {
      title: 'Navigation system calibration',
      description: 'Calibrate navigation systems on INS Vikrant',
      departmentId: departments[0]._id,
      assignedBy: admin._id,
      priority: 'medium' as const,
      dueDate: daysAgo(3),
      status: 'ongoing' as const,
    },
    {
      title: 'Fuel supply audit',
      description: 'Audit fuel inventory across naval bases',
      departmentId: departments[1]._id,
      assignedBy: admin._id,
      priority: 'high' as const,
      dueDate: daysFromNow(14),
      status: 'ongoing' as const,
    },
    {
      title: 'Spare parts procurement',
      description: 'Procure critical spare parts for destroyer fleet',
      departmentId: departments[1]._id,
      assignedBy: admin._id,
      priority: 'medium' as const,
      dueDate: daysAgo(1),
      status: 'ongoing' as const,
    },
    {
      title: 'Engine overhaul - INS Kolkata',
      description: 'Complete scheduled engine maintenance',
      departmentId: departments[2]._id,
      assignedBy: admin._id,
      priority: 'high' as const,
      dueDate: daysAgo(10),
      status: 'completed' as const,
      completedAt: daysAgo(2),
    },
    {
      title: 'Radar system upgrade',
      description: 'Upgrade radar systems on patrol vessels',
      departmentId: departments[2]._id,
      assignedBy: admin._id,
      priority: 'high' as const,
      dueDate: daysFromNow(30),
      status: 'ongoing' as const,
    },
    {
      title: 'Annual medical checkup drive',
      description: 'Organize annual health screening for personnel',
      departmentId: departments[3]._id,
      assignedBy: admin._id,
      priority: 'medium' as const,
      dueDate: daysFromNow(21),
      status: 'ongoing' as const,
    },
    {
      title: 'Personnel records digitization',
      description: 'Digitize legacy personnel records',
      departmentId: departments[4]._id,
      assignedBy: admin._id,
      priority: 'low' as const,
      dueDate: daysAgo(5),
      status: 'completed' as const,
      completedAt: daysAgo(1),
    },
    {
      title: 'Training schedule preparation',
      description: 'Prepare Q2 training schedule for new recruits',
      departmentId: departments[4]._id,
      assignedBy: admin._id,
      priority: 'medium' as const,
      dueDate: daysFromNow(10),
      status: 'ongoing' as const,
    },
  ];

  await Task.insertMany(tasksData);
  console.log(`Created ${tasksData.length} sample tasks`);

  console.log('\nSeed complete!');
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('Dept user login: officer1@navy.in / dept123');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
