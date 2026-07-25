import { Router } from 'express';
import { z } from 'zod';
import { Department } from '../models/Department';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

const router = Router();

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(10),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

router.get('/', authenticate, async (_req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    return res.json(
      departments.map((dept) => ({
        id: dept._id.toString(),
        name: dept.name,
        code: dept.code,
        description: dept.description,
        isActive: dept.isActive,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, requireAdmin, validateBody(departmentSchema), async (req, res, next) => {
  try {
    const { name, code, description } = req.body;

    const existing = await Department.findOne({
      $or: [{ name }, { code: code.toUpperCase() }],
    });
    if (existing) {
      return res.status(409).json({ message: 'Department name or code already exists' });
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description: description || '',
    });

    return res.status(201).json({
      id: department._id.toString(),
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, requireAdmin, validateBody(departmentSchema.partial()), async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    const { name, code, description, isActive } = req.body;

    if (name && name !== department.name) {
      const nameExists = await Department.findOne({ name, _id: { $ne: department._id } });
      if (nameExists) {
        return res.status(409).json({ message: 'Department name already exists' });
      }
      department.name = name;
    }

    if (code && code.toUpperCase() !== department.code) {
      const codeExists = await Department.findOne({ code: code.toUpperCase(), _id: { $ne: department._id } });
      if (codeExists) {
        return res.status(409).json({ message: 'Department code already exists' });
      }
      department.code = code.toUpperCase();
    }

    if (description !== undefined) department.description = description;
    if (isActive !== undefined) department.isActive = isActive;

    await department.save();

    return res.json({
      id: department._id.toString(),
      name: department.name,
      code: department.code,
      description: department.description,
      isActive: department.isActive,
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    department.isActive = false;
    await department.save();

    return res.json({ message: 'Department deactivated' });
  } catch (err) {
    next(err);
  }
});

export default router;
