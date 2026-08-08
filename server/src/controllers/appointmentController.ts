import { Request, Response } from 'express';
import Appointment from '../models/Appointment';
import Lead from '../models/Lead';
import LawyerProfile from '../models/LawyerProfile';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { createGoogleMeetEvent } from '../services/googleCalendar';

/** Extract the LawyerProfile ObjectId from an appointment, handling both populated and non-populated states */
function getAppointmentLawyerId(appointment: any): string {
  // If lawyerId is populated (a document), use its _id
  if (appointment.lawyerId && typeof appointment.lawyerId === 'object' && appointment.lawyerId._id) {
    return appointment.lawyerId._id.toString();
  }
  // Fallback: raw ObjectId
  return appointment.lawyerId?.toString?.() || '';
}

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
    
    // For lawyer check: appointment.lawyerId is a LawyerProfile ID, not a User ID
    let isLawyer = false;
    if (user.role === 'lawyer') {
      const lawyerProfile = await (await import('../models/LawyerProfile')).default.findOne({ userId: user._id });
      if (lawyerProfile && appointment.lawyerId.toString() === lawyerProfile._id.toString()) {
        isLawyer = true;
      }
    }

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

// @desc    Generate Google Meet link for an appointment
// @route   POST /api/appointments/:id/generate-meeting
const generateMeetingLink = async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('clientId', 'firstName lastName email')
      .populate({
        path: 'lawyerId',
        populate: { path: 'userId', select: 'firstName lastName email' },
      });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only the assigned lawyer can generate a meeting link
    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    if (!lawyerProfile || getAppointmentLawyerId(appointment) !== lawyerProfile._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned lawyer can generate a meeting link' });
    }

    if (appointment.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Meeting link can only be generated after payment' });
    }

    // Try auto-generation via Google Calendar
    const lawyerUser = (appointment.lawyerId as any)?.userId;
    const clientUser = appointment.clientId as any;

    const summary = `Consultation: ${lawyerUser?.firstName || 'Lawyer'} & ${clientUser?.firstName || 'Client'}`;
    const description = `Advisora Connect Consultation\nService: ${appointment.consultationType}\nDuration: ${appointment.duration} minutes`;
    const attendees = [lawyerUser?.email, clientUser?.email].filter(Boolean) as string[];

    const meetLink = await createGoogleMeetEvent(
      summary,
      description,
      appointment.date,
      appointment.duration,
      attendees,
    );

    if (meetLink) {
      appointment.meetingLink = meetLink;
      appointment.completionSource = 'auto';
      await appointment.save();
      return res.json({ message: 'Meeting link generated', meetingLink: meetLink, source: 'auto' });
    }

    // Fallback: return a message asking the lawyer to add a link manually
    res.json({
      message: 'Auto-generation unavailable. Please add a meeting link manually.',
      meetingLink: null,
      source: 'manual',
      hint: 'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY env vars for auto-generation.',
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Manually set meeting link for an appointment
// @route   PUT /api/appointments/:id/meeting-link
const setMeetingLink = async (req: AuthRequest, res: Response) => {
  try {
    const { meetingLink } = req.body;
    if (!meetingLink) {
      return res.status(400).json({ message: 'Meeting link is required' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only the assigned lawyer can set the meeting link
    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    if (!lawyerProfile || appointment.lawyerId.toString() !== lawyerProfile._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned lawyer can set the meeting link' });
    }

    appointment.meetingLink = meetingLink;
    appointment.completionSource = 'manual';
    await appointment.save();

    res.json({ message: 'Meeting link updated', meetingLink, source: 'manual' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

// @desc    Mark appointment as completed (lawyer only)
// @route   PUT /api/appointments/:id/complete
const completeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Only the assigned lawyer can mark as complete
    const lawyerProfile = await LawyerProfile.findOne({ userId: user._id });
    if (!lawyerProfile || appointment.lawyerId.toString() !== lawyerProfile._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned lawyer can mark the appointment as complete' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot complete a cancelled appointment' });
    }

    if (appointment.paymentStatus !== 'paid') {
      return res.status(400).json({ message: 'Cannot complete an unpaid appointment' });
    }

    appointment.status = 'completed';
    if (!appointment.completionSource) {
      appointment.completionSource = 'manual';
    }
    await appointment.save();

    // Update linked lead status
    if (appointment.leadId) {
      await Lead.findByIdAndUpdate(appointment.leadId, { status: 'closed' });
    }

    res.json({ message: 'Appointment marked as completed', appointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: (error as Error).message });
  }
};

export { getMyAppointments, getLawyerAppointments, cancelAppointment, generateMeetingLink, setMeetingLink, completeAppointment };
