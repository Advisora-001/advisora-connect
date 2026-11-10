import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import ProBonoApplication, { proBonoApplicationCategories, proBonoUrgencies } from '../models/ProBonoApplication';
import ProBonoVolunteer, { proBonoVolunteerContributionTypes, proBonoVolunteerProfessions } from '../models/ProBonoVolunteer';

const normalizeEmail = (email: string) => String(email || '').trim().toLowerCase();

const submitProBonoApplication = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, category, urgency, description, financialHardshipNote } = req.body;

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    const trimmedEmail = normalizeEmail(typeof email === 'string' ? email : '');
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedPhone || !trimmedDescription) {
      return res.status(400).json({ message: 'Full name, email, phone number, and description are required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    if (trimmedDescription.length < 20 || trimmedDescription.length > 2000) {
      return res.status(400).json({ message: 'The legal situation summary must be between 20 and 2000 characters.' });
    }

    const safeCategory = typeof category === 'string' ? category.trim() : '';
    if (!proBonoApplicationCategories.includes(safeCategory as (typeof proBonoApplicationCategories)[number])) {
      return res.status(400).json({ message: 'Please select a valid application category.' });
    }

    const safeUrgency = typeof urgency === 'string' ? urgency.trim() : 'moderate';
    if (!proBonoUrgencies.includes(safeUrgency as (typeof proBonoUrgencies)[number])) {
      return res.status(400).json({ message: 'Please select a valid urgency level.' });
    }

    const application = await ProBonoApplication.create({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      category: safeCategory,
      urgency: safeUrgency,
      description: trimmedDescription,
      financialHardshipNote: typeof financialHardshipNote === 'string' ? financialHardshipNote.trim().slice(0, 500) : '',
    });

    res.status(201).json({
      message: 'Your pro bono application has been submitted successfully.',
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to submit pro bono application.',
      error: (error as Error).message,
    });
  }
};

const submitProBonoVolunteer = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, profession, barNumber, practiceAreas, contributionType, availabilityNote } = req.body;

    const trimmedName = typeof fullName === 'string' ? fullName.trim() : '';
    const trimmedEmail = normalizeEmail(typeof email === 'string' ? email : '');
    const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedPhone) {
      return res.status(400).json({ message: 'Full name, email, and phone number are required.' });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedEmail)) {
      return res.status(400).json({ message: 'Please provide a valid email address.' });
    }

    const safeProfession = typeof profession === 'string' ? profession.trim() : '';
    if (!proBonoVolunteerProfessions.includes(safeProfession as (typeof proBonoVolunteerProfessions)[number])) {
      return res.status(400).json({ message: 'Please select a valid profession.' });
    }

    const safeContributionType = typeof contributionType === 'string' ? contributionType.trim() : '';
    if (!proBonoVolunteerContributionTypes.includes(safeContributionType as (typeof proBonoVolunteerContributionTypes)[number])) {
      return res.status(400).json({ message: 'Please select a valid volunteer contribution type.' });
    }

    const volunteer = await ProBonoVolunteer.create({
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      profession: safeProfession,
      barNumber: typeof barNumber === 'string' ? barNumber.trim().slice(0, 100) : '',
      practiceAreas: typeof practiceAreas === 'string' ? practiceAreas.trim().slice(0, 500) : '',
      contributionType: safeContributionType,
      availabilityNote: typeof availabilityNote === 'string' ? availabilityNote.trim().slice(0, 500) : '',
    });

    res.status(201).json({
      message: 'Your volunteer registration has been submitted successfully.',
      volunteer,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to register as a pro bono volunteer.',
      error: (error as Error).message,
    });
  }
};

const getProBonoApplications = async (_req: AuthRequest, res: Response) => {
  try {
    const applications = await ProBonoApplication.find().sort({ createdAt: -1 });
    res.json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pro bono applications.', error: (error as Error).message });
  }
};

const getProBonoVolunteers = async (_req: AuthRequest, res: Response) => {
  try {
    const volunteers = await ProBonoVolunteer.find().sort({ createdAt: -1 });
    res.json({ count: volunteers.length, volunteers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pro bono volunteers.', error: (error as Error).message });
  }
};

const updateProBonoApplicationStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!['new', 'reviewing', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const application = await ProBonoApplication.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : '',
      },
      { new: true }
    );

    if (!application) {
      return res.status(404).json({ message: 'Pro bono application not found.' });
    }

    res.json({ message: 'Pro bono application status updated.', application });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update pro bono application status.', error: (error as Error).message });
  }
};

const updateProBonoVolunteerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    if (!['new', 'reviewing', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Valid status is required.' });
    }

    const volunteer = await ProBonoVolunteer.findByIdAndUpdate(
      req.params.id,
      {
        status,
        notes: typeof notes === 'string' ? notes.trim().slice(0, 1000) : '',
      },
      { new: true }
    );

    if (!volunteer) {
      return res.status(404).json({ message: 'Pro bono volunteer not found.' });
    }

    res.json({ message: 'Pro bono volunteer status updated.', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update pro bono volunteer status.', error: (error as Error).message });
  }
};

export {
  submitProBonoApplication,
  submitProBonoVolunteer,
  getProBonoApplications,
  getProBonoVolunteers,
  updateProBonoApplicationStatus,
  updateProBonoVolunteerStatus,
};
