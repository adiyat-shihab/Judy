import type { Request, Response } from 'express';
import User, { Role } from '../models/User';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a user's role to 'Buyer'
// @route   PATCH /api/users/:id/role
// @access  Private (Admin only)
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;

    // Admin can only assign the Buyer role — no escalation to Admin allowed
    if (role !== Role.BUYER) {
      res.status(400).json({ message: 'Admin can only assign the Buyer role' });
      return;
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (user.role === Role.ADMIN) {
      res.status(400).json({ message: 'Cannot change role of another Admin' });
      return;
    }

    user.role = Role.BUYER;
    await user.save();

    res.status(200).json({
      message: `User '${user.name}' has been assigned the Buyer role`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
