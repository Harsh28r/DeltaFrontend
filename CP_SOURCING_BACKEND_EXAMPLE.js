// CP Sourcing Backend Controller Example
// This shows how your CP Sourcing backend should be structured

const CPSourcing = require('../models/CPSourcing');
const ChannelPartner = require('../models/ChannelPartner');
const Joi = require('joi');
const multer = require('multer');
const fs = require('fs');

// Multer configuration for CP Sourcing
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/cpsourcing'; // Note: cpsourcing directory
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('File is not an image'), false);
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Validation schemas
const createCPSourcingSchema = Joi.object({
  channelPartnerId: Joi.string().required(),
  projectId: Joi.string().required(),
  location: Joi.object({
    lat: Joi.number().required(),
    lng: Joi.number().required()
  }).required(),
  notes: Joi.string().optional()
});

const createCPSourcing = async (req, res) => {
  const { error } = createCPSourcingSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  try {
    // Create sourcing history entry
    const sourcingHistoryEntry = {
      location: req.body.location,
      date: new Date(),
      selfie: req.file ? req.file.path : '', // This is the key part!
      notes: req.body.notes || ''
    };

    // Check if sourcing record already exists
    let cpSourcing = await CPSourcing.findOne({
      channelPartnerId: req.body.channelPartnerId,
      projectId: req.body.projectId
    });

    if (cpSourcing) {
      // Add to existing sourcing history
      cpSourcing.sourcingHistory.push(sourcingHistoryEntry);
      cpSourcing.updatedAt = new Date();
    } else {
      // Create new sourcing record
      cpSourcing = new CPSourcing({
        userId: req.user._id,
        channelPartnerId: req.body.channelPartnerId,
        projectId: req.body.projectId,
        sourcingHistory: [sourcingHistoryEntry],
        isActive: true
      });
    }

    await cpSourcing.save();
    res.status(201).json(cpSourcing);
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: err.message });
  }
};

const getCPSourcing = async (req, res) => {
  try {
    const cpSourcing = await CPSourcing.find()
      .populate('userId', 'name email')
      .populate('channelPartnerId', 'name phone')
      .populate('projectId', 'name location')
      .sort({ createdAt: -1 });
    
    res.json(cpSourcing);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createCPSourcing: [upload.single('selfie'), createCPSourcing],
  getCPSourcing
};
