import express from 'express';
import { getAllUsers, updateUserRole } from '../controllers/userController';
import { protect, authorize } from '../middlewares/authMiddleware';
import { Role } from '../models/User';

const router = express.Router();

// All routes below require a valid JWT + Admin role
router.use(protect, authorize(Role.ADMIN));

// @route GET  /api/users          → Get all users
// @route PATCH /api/users/:id/role → Update a user's role to Buyer
router.get('/', getAllUsers);
router.patch('/:id/role', updateUserRole);

export default router;
