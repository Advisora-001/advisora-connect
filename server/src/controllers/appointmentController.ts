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


// @desc    Cancel an appointment (client can cancel unpaid; lawyer can decline)
// @route   PUT /api/appointments/:id/cancel
const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only client who owns the appointment or the lawyer assigned can cancel
    const isClient = appointment.clientId.toString() === user._id.toString();
    const isLawyer = appointment.lawyerId.toString() === user._id.toString();

    if (!isClient && !isLawyer) {
      return res.status(403).json({ message: 'Not authorized to cancel this appointment' });
    }

    // Can only cancel unpaid appointments
    if (appointment.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Cannot cancel a paid appointment. Please contact support.' });
    }

    appointment.status = 'cancelled';
    await appointment.save();

    // If there's a linked lead, update it
    if (appointment.leadId) {
      await Lead.findByIdAndUpdate(appointment.leadId, { status: 'cancelled' });
    }

    res.json({ message: 'Appointment cancelled', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

export { getMyAppointments, getLawyerAppointments, cancelAppointment };