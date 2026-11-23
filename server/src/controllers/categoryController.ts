import { Request, Response } from 'express';
import ProfessionalCategory from '../models/ProfessionalCategory';
import { AuthRequest } from '../middleware/auth';

// @desc    Get all active categories (public)
// @route   GET /api/categories
const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await ProfessionalCategory.find({ isActive: true }).sort({ label: 1 });
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAdminCategories = async (_req: AuthRequest, res: Response) => {
  try {
    const categories = await ProfessionalCategory.find().sort({ label: 1 });
    res.json({ categories });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single category by key (public)
// @route   GET /api/categories/:key
const getCategoryByKey = async (req: Request, res: Response) => {
  try {
    const category = await ProfessionalCategory.findOne({ key: req.params.key, isActive: true });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ category });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a category (admin)
// @route   POST /api/admin/categories
const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { key, label, description, specializations, registrationFields, verificationRequirements, serviceTypes, consultationModes } = req.body;

    if (!key || !label) {
      return res.status(400).json({ message: 'Key and label are required' });
    }

    const existing = await ProfessionalCategory.findOne({ key });
    if (existing) {
      return res.status(400).json({ message: 'Category key already exists' });
    }

    const category = await ProfessionalCategory.create({
      key,
      label,
      description: description || '',
      isActive: true,
      specializations: specializations || [],
      registrationFields: registrationFields || [],
      verificationRequirements: verificationRequirements || { requiredDocs: [], criteria: [] },
      serviceTypes: serviceTypes || [],
      consultationModes: consultationModes || ['video'],
    });

    res.status(201).json({ message: 'Category created', category });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a category (admin)
// @route   PUT /api/admin/categories/:id
const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    const { label, description, specializations, registrationFields, verificationRequirements, serviceTypes, consultationModes, isActive } = req.body;

    const category = await ProfessionalCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (label !== undefined) category.label = label;
    if (description !== undefined) category.description = description;
    if (specializations !== undefined) category.specializations = specializations;
    if (registrationFields !== undefined) category.registrationFields = registrationFields;
    if (verificationRequirements !== undefined) category.verificationRequirements = verificationRequirements;
    if (serviceTypes !== undefined) category.serviceTypes = serviceTypes;
    if (consultationModes !== undefined) category.consultationModes = consultationModes;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    res.json({ message: 'Category updated', category });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Deactivate a category (admin)
// @route   DELETE /api/admin/categories/:id
const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    const category = await ProfessionalCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.isActive = false;
    await category.save();
    res.json({ message: 'Category deactivated' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { getCategories, getAdminCategories, getCategoryByKey, createCategory, updateCategory, deleteCategory };