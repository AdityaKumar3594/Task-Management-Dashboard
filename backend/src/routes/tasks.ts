import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task';
import { Department } from '../models/Department';
import { User } from '../models/User';
import { authenticate, canAccessDepartment } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { getDisplayStatus } from '../utils/taskStatus';
import { DisplayStatus } from '../types';

const router = Router();

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedToId: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['ongoing', 'completed']).optional(),
});

const taskQuerySchema = z.object({
  departmentId: z.string().optional(),
  status: z.enum(['completed', 'ongoing', 'overdue']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

function formatTask(task: InstanceType<typeof Task>) {
  const department =
    task.departmentId && typeof task.departmentId === 'object' && 'name' in task.departmentId
      ? {
          id: task.departmentId._id.toString(),
          name: (task.departmentId as unknown as { name: string; code: string }).name,
          code: (task.departmentId as unknown as { name: string; code: string }).code,
        }
      : null;

  const assignedBy =
    task.assignedBy && typeof task.assignedBy === 'object' && 'name' in task.assignedBy
      ? { id: task.assignedBy._id.toString(), name: task.assignedBy.name }
      : null;

  const assignedTo =
    task.assignedTo && typeof task.assignedTo === 'object' && 'name' in task.assignedTo
      ? { id: task.assignedTo._id.toString(), name: (task.assignedTo as unknown as { name: string }).name }
      : null;

  const displayStatus = getDisplayStatus(task.status, task.dueDate);

  return {
    id: task._id.toString(),
    title: task.title,
    description: task.description,
    departmentId: department?.id || task.departmentId.toString(),
    department,
    assignedBy,
    assignedTo,
    priority: task.priority,
    dueDate: task.dueDate,
    status: task.status,
    displayStatus,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

// FIX #4: department-users route MUST be before /:id to avoid Express matching
// "department-users" as an ID param
router.get('/department-users/:departmentId', authenticate, async (req, res, next) => {
  try {
    const users = await User.find({
      departmentId: req.params.departmentId,
      role: 'department_user',
    }).select('name email');

    return res.json(
      users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email }))
    );
  } catch (err) {
    next(err);
  }
});

router.get('/', authenticate, validateQuery(taskQuerySchema), async (req, res, next) => {
  try {
    const { departmentId, status, priority } = req.query as z.infer<typeof taskQuerySchema>;

    const filter: Record<string, unknown> = {};

    if (req.user!.role === 'department_user') {
      filter.departmentId = req.user!.departmentId;
    } else if (departmentId) {
      filter.departmentId = departmentId;
    }

    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter)
      .populate('departmentId', 'name code')
      .populate('assignedBy', 'name')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });

    let formatted = tasks.map(formatTask);

    if (status) {
      formatted = formatted.filter((task) => task.displayStatus === (status as DisplayStatus));
    }

    return res.json(formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, validateBody(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, departmentId, assignedToId, priority, dueDate } = req.body;

    if (req.user!.role === 'department_user' && req.user!.departmentId !== departmentId) {
      return res.status(403).json({ message: 'You can only create tasks for your department' });
    }

    const department = await Department.findById(departmentId);
    if (!department || !department.isActive) {
      return res.status(400).json({ message: 'Invalid department' });
    }

    if (assignedToId) {
      const assignee = await User.findById(assignedToId);
      if (!assignee || assignee.departmentId?.toString() !== departmentId) {
        return res.status(400).json({ message: 'Assigned user must belong to the selected department' });
      }
    }

    const task = await Task.create({
      title,
      description: description || '',
      departmentId,
      assignedBy: req.user!.id,
      assignedTo: assignedToId || null,
      priority: priority || 'medium',
      dueDate: dueDate ? new Date(dueDate) : null,
      status: 'ongoing',
    });

    await task.populate('departmentId', 'name code');
    await task.populate('assignedBy', 'name');
    await task.populate('assignedTo', 'name');

    return res.status(201).json(formatTask(task));
  } catch (err) {
    next(err);
  }
});

router.put('/:id', authenticate, validateBody(updateTaskSchema), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!canAccessDepartment(req, task.departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, description, departmentId, assignedToId, priority, dueDate, status } = req.body;

    if (departmentId && req.user!.role === 'department_user' && req.user!.departmentId !== departmentId) {
      return res.status(403).json({ message: 'You cannot reassign tasks to other departments' });
    }

    const effectiveDeptId = departmentId || task.departmentId.toString();

    if (departmentId) {
      const department = await Department.findById(departmentId);
      if (!department || !department.isActive) {
        return res.status(400).json({ message: 'Invalid department' });
      }
      task.departmentId = department._id;
    }

    if (assignedToId !== undefined) {
      if (assignedToId === null || assignedToId === '') {
        task.assignedTo = null;
      } else {
        const assignee = await User.findById(assignedToId);
        if (!assignee || assignee.departmentId?.toString() !== effectiveDeptId) {
          return res.status(400).json({ message: 'Assigned user must belong to the selected department' });
        }
        task.assignedTo = assignee._id;
      }
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (priority) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : null;

    if (status) {
      task.status = status;
      task.completedAt = status === 'completed' ? new Date() : null;
    }

    await task.save();
    await task.populate('departmentId', 'name code');
    await task.populate('assignedBy', 'name');
    await task.populate('assignedTo', 'name');

    return res.json(formatTask(task));
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/complete', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!canAccessDepartment(req, task.departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    task.status = 'completed';
    task.completedAt = new Date();
    await task.save();
    await task.populate('departmentId', 'name code');
    await task.populate('assignedBy', 'name');
    await task.populate('assignedTo', 'name');

    return res.json(formatTask(task));
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (!canAccessDepartment(req, task.departmentId.toString())) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await task.deleteOne();
    return res.json({ message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
