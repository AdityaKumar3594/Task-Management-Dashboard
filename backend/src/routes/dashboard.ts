import { Router } from 'express';
import { Task } from '../models/Task';
import { Department } from '../models/Department';
import { authenticate } from '../middleware/auth';
import { countByDisplayStatus } from '../utils/taskStatus';

const router = Router();

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const filter = req.user!.role === 'department_user'
      ? { departmentId: req.user!.departmentId }
      : {};

    const tasks = await Task.find(filter).select('status dueDate');
    const counts = countByDisplayStatus(tasks);

    return res.json({
      total: counts.total,
      completed: counts.completed,
      ongoing: counts.ongoing,
      overdue: counts.overdue,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/by-department', authenticate, async (req, res, next) => {
  try {
    const isDeptUser = req.user!.role === 'department_user';

    // Dept users only see their own department
    const deptFilter = isDeptUser
      ? { isActive: true, _id: req.user!.departmentId }
      : { isActive: true };

    const taskFilter = isDeptUser
      ? { departmentId: req.user!.departmentId }
      : {};

    const departments = await Department.find(deptFilter).sort({ name: 1 });
    const tasks = await Task.find(taskFilter).select('departmentId status dueDate');

    const breakdown = departments.map((dept) => {
      const deptTasks = tasks.filter((task) => task.departmentId.toString() === dept._id.toString());
      const counts = countByDisplayStatus(deptTasks);
      const completionRate =
        counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;

      return {
        departmentId: dept._id.toString(),
        name: dept.name,
        code: dept.code,
        total: counts.total,
        completed: counts.completed,
        ongoing: counts.ongoing,
        overdue: counts.overdue,
        completionRate,
      };
    });

    return res.json(breakdown);
  } catch (err) {
    next(err);
  }
});

export default router;
