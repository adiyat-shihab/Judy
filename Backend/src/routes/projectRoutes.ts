import express from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  getProjectRequests,
  assignSolver,
  updateProject,
  deleteProject,
} from '../controllers/projectController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route GET  /api/projects     → All roles can browse projects
// @route POST /api/projects     → Buyer only can create
router.get('/', getProjects);
router.post('/', authorize(Role.BUYER), createProject);

// @route GET    /api/projects/:id  → All roles can view a project
// @route PATCH  /api/projects/:id  → Buyer (owner) edits title/description (Unassigned only)
// @route DELETE /api/projects/:id  → Buyer (owner) deletes a project (Unassigned only)
router.get('/:id', getProjectById);
router.patch('/:id', authorize(Role.BUYER), updateProject);
router.delete('/:id', authorize(Role.BUYER), deleteProject);

// @route GET   /api/projects/:id/requests → Buyer (owner) views requests
// @route PATCH /api/projects/:id/assign   → Buyer (owner) assigns a solver
router.get('/:id/requests', authorize(Role.BUYER), getProjectRequests);
router.patch('/:id/assign', authorize(Role.BUYER), assignSolver);

export default router;
