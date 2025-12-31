import { body, validationResult } from 'express-validator';

// Validation rules for headshot generation
export const validateGenerationRequest = [
  body('style')
    .notEmpty()
    .withMessage('Style is required')
    .isIn(['Corporate Classic', 'Creative Professional', 'Executive Portrait'])
    .withMessage('Invalid style. Must be one of: Corporate Classic, Creative Professional, Executive Portrait'),
  
  body('imageId')
    .notEmpty()
    .withMessage('Image ID is required')
    .isUUID()
    .withMessage('Invalid image ID format'),
];

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  
  next();
};

// Validate file upload
export const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded. Please select an image file.'
    });
  }
  
  // Additional file validation
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024;
  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      error: 'File too large. Maximum size is 10MB.'
    });
  }
  
  next();
};