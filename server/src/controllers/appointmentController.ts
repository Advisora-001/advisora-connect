import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../middleware/auth';

// @desc    Get client's appointments
// @route   GET /api/appointments/my-appointments
const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const appointments = await Appointment.find({ clientId: req.user?._id })
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName email avatar' },
      })
      .sort({ date: -1 });

    res.json({ count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get lawyer's appointments
// @route   GET /api/appointments/lawyer-appointments
const getLawyerAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const profile = await (await import('../models/LawyerProfile')).default.findOne({ userId: req.user?._id });
    if (!profile) {
      return res.status(404).json({ message: 'Lawyer profile not found' });
    }

    const appointments = await Appointment.find({ lawyerId: profile._id })
      .populate('clientId', 'firstName lastName email')
      .sort({ date: -1 });

    res.json({ count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export { getMyAppointments, getLawyerAppointments };