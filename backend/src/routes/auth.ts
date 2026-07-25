import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { signToken } from '../utils/jwt';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['admin', 'department_user']),
  departmentId: z.string().optional().nullable(),
});

router.post('/login', validateBody(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const authUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null,
    };

    const token = signToken(authUser);

    let department = null;
    if (user.departmentId) {
      const dept = await Department.findById(user.departmentId);
      if (dept) {
        department = { id: dept._id.toString(), name: dept.name, code: dept.code };
      }
    }

    return res.json({ token, user: { ...authUser, department } });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let department = null;
    if (user.departmentId) {
      const dept = await Department.findById(user.departmentId);
      if (dept) {
        department = { id: dept._id.toString(), name: dept.name, code: dept.code };
      }
    }

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null,
      department,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/users', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const users = await User.find().select('-passwordHash').populate('departmentId', 'name code');
    return res.json(
      users.map((user) => ({
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
          ? typeof user.departmentId === 'object' && 'name' in user.departmentId
            ? user.departmentId._id.toString()
            : user.departmentId.toString()
          : null,
        department:
          user.departmentId && typeof user.departmentId === 'object' && 'name' in user.departmentId
            ? {
                id: user.departmentId._id.toString(),
                name: (user.departmentId as unknown as { name: string; code: string }).name,
                code: (user.departmentId as unknown as { name: string; code: string }).code,
              }
            : null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/users', authenticate, requireAdmin, validateBody(createUserSchema), async (req, res, next) => {
  try {
    const { name, email, password, role, departmentId } = req.body;

    if (role === 'department_user' && !departmentId) {
      return res.status(400).json({ message: 'Department is required for department users' });
    }

    if (role === 'admin' && departmentId) {
      return res.status(400).json({ message: 'Admin users cannot be assigned to a department' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept || !dept.isActive) {
        return res.status(400).json({ message: 'Invalid department' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      departmentId: role === 'department_user' ? departmentId : null,
    });

    return res.status(201).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
