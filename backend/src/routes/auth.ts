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

// Admin: reset any user's password — MUST be registered before PUT /users/:id
// so Express doesn't treat "reset-password" as an :id param
const adminResetPasswordSchema = z.object({
  newPassword: z.string().min(6),
});

router.patch('/users/:id/reset-password', authenticate, requireAdmin, validateBody(adminResetPasswordSchema), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.passwordHash = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'department_user']).optional(),
  departmentId: z.string().optional().nullable(),
});

router.put('/users/:id', authenticate, requireAdmin, validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const { name, email, role, departmentId } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email && email.toLowerCase() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ message: 'Email already in use' });
      user.email = email.toLowerCase();
    }

    if (role === 'department_user' && !departmentId) {
      return res.status(400).json({ message: 'Department is required for department users' });
    }
    if (role === 'admin' && departmentId) {
      return res.status(400).json({ message: 'Admin users cannot be assigned to a department' });
    }
    if (departmentId) {
      const dept = await Department.findById(departmentId);
      if (!dept || !dept.isActive) return res.status(400).json({ message: 'Invalid department' });
    }

    if (name) user.name = name;
    if (role) {
      user.role = role;
      user.departmentId = role === 'department_user' && departmentId ? departmentId : null;
    }

    await user.save();

    const populated = await User.findById(user._id)
      .select('-passwordHash')
      .populate('departmentId', 'name code');

    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId ? user.departmentId.toString() : null,
      department:
        populated?.departmentId &&
        typeof populated.departmentId === 'object' &&
        'name' in populated.departmentId
          ? {
              id: populated.departmentId._id.toString(),
              name: (populated.departmentId as unknown as { name: string; code: string }).name,
              code: (populated.departmentId as unknown as { name: string; code: string }).code,
            }
          : null,
    });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

router.patch('/change-password', authenticate, validateBody(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ message: 'Current password is incorrect' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
