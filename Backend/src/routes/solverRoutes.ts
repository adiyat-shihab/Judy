import express from 'express';
import {
  requestToWork,
  getMyProject,
  createTask,
  getTasks,
  submitTask,
  getTaskSubmission,
  reviewSubmission,
} from '../controllers/solverController';
import { protect, authorize } from '../middlewares/authMiddleware';
import upload from '../middlewares/uploadMiddleware';
import { Role } from '../models/User';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route GET  /api/solver/my-project → Solver fetches their currently assigned project
router.get('/my-project', authorize(Role.PROBLEM_SOLVER), getMyProject);

// @route POST /api/projects/:id/requests → Solver requests to work on a project
router.post('/projects/:id/requests', authorize(Role.PROBLEM_SOLVER), requestToWork);

// @route POST /api/projects/:id/tasks   → Assigned solver creates a task
// @route GET  /api/projects/:id/tasks   → View all tasks for a project
router.post('/projects/:id/tasks', authorize(Role.PROBLEM_SOLVER), createTask);
router.get('/projects/:id/tasks', getTasks);

// @route GET   /api/tasks/:id/submission → Get latest submission for a task (buyer/solver)
// @route POST  /api/tasks/:id/submit     → Solver uploads a ZIP file for a task
// @route PATCH /api/tasks/:id/review     → Buyer accepts or rejects the submission
router.get('/tasks/:id/submission', getTaskSubmission);
router.post('/tasks/:id/submit', authorize(Role.PROBLEM_SOLVER), upload.single('file'), submitTask);
router.patch('/tasks/:id/review', authorize(Role.BUYER), reviewSubmission);

export default router;
