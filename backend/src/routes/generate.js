import express from 'express';
import upload, { handleUploadError } from '../middleware/upload.js';
import { validateFileUpload, validateGenerationRequest, handleValidationErrors } from '../middleware/validation.js';
import ImageGenerationService from '../services/imageGeneration.js';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const imageService = new ImageGenerationService();

// Store upload sessions temporarily (in production, use Redis or database)
const uploadSessions = new Map();

/**
 * POST /api/upload
 * Upload and validate image file
 */
router.post('/upload', upload.single('image'), handleUploadError, validateFileUpload, async (req, res) => {
  try {
    const { file } = req;
    const sessionId = uuidv4();
    
    console.log(`Image uploaded: ${file.filename}, Size: ${file.size} bytes`);
    
    // Process the uploaded image
    const processedImagePath = await imageService.processUploadedImage(file.path);
    
    // Store session info
    uploadSessions.set(sessionId, {
      originalPath: file.path,
      processedPath: processedImagePath,
      originalName: file.originalname,
      uploadTime: new Date(),
      fileSize: file.size
    });
    
    // Clean up after 1 hour
    setTimeout(() => {
      imageService.cleanup([file.path, processedImagePath]);
      uploadSessions.delete(sessionId);
    }, 60 * 60 * 1000);
    
    res.json({
      success: true,
      message: 'Image uploaded and processed successfully',
      data: {
        sessionId,
        originalName: file.originalname,
        fileSize: file.size,
        processedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Upload processing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process uploaded image',
      details: error.message
    });
  }
});

/**
 * POST /api/generate
 * Generate professional headshot
 */
router.post('/generate', validateGenerationRequest, handleValidationErrors, async (req, res) => {
  try {
    const { sessionId, style } = req.body;
    
    // Retrieve upload session
    const session = uploadSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Upload session not found or expired. Please upload your image again.'
      });
    }
    
    console.log(`Generating headshot for session: ${sessionId}, Style: ${style}`);
    
    const startTime = Date.now();
    
    // Generate the headshot
    const result = await imageService.generateHeadshot(session.processedPath, style);
    
    const processingTime = Date.now() - startTime;
    
    // Store generation result in session
    session.generatedImagePath = result.generatedImagePath;
    session.generatedImageId = result.generatedImageId;
    session.style = style;
    session.processingTime = processingTime;
    
    res.json({
      success: true,
      message: 'Headshot generated successfully',
      data: {
        imageId: result.generatedImageId,
        style: style,
        processingTime: processingTime,
        generatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate headshot',
      details: error.message
    });
  }
});

/**
 * GET /api/image/:imageId
 * Serve generated image
 */
router.get('/image/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Find the session with this image ID
    let imagePath = null;
    for (const session of uploadSessions.values()) {
      if (session.generatedImageId === imageId) {
        imagePath = session.generatedImagePath;
        break;
      }
    }
    
    if (!imagePath) {
      return res.status(404).json({
        success: false,
        error: 'Image not found or expired'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(imagePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    // Serve the image
    res.sendFile(path.resolve(imagePath));
    
  } catch (error) {
    console.error('Image serving error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to serve image'
    });
  }
});

/**
 * GET /api/download/:imageId
 * Download generated headshot
 */
router.get('/download/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params;
    
    // Find the session with this image ID
    let session = null;
    for (const [sessionId, sessionData] of uploadSessions.entries()) {
      if (sessionData.generatedImageId === imageId) {
        session = sessionData;
        break;
      }
    }
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Image not found or expired'
      });
    }
    
    // Check if file exists
    try {
      await fs.access(session.generatedImagePath);
    } catch {
      return res.status(404).json({
        success: false,
        error: 'Image file not found'
      });
    }
    
    // Create download filename
    const originalName = path.parse(session.originalName).name;
    const styleSlug = session.style.toLowerCase().replace(/\s+/g, '-');
    const downloadName = `${originalName}-${styleSlug}-headshot.jpg`;
    
    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    res.setHeader('Content-Type', 'image/jpeg');
    
    // Send file
    res.sendFile(path.resolve(session.generatedImagePath));
    
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download image'
    });
  }
});

/**
 * GET /api/styles
 * Get available headshot styles
 */
router.get('/styles', (req, res) => {
  try {
    const styles = imageService.getAvailableStyles();
    res.json({
      success: true,
      data: styles
    });
  } catch (error) {
    console.error('Styles error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available styles'
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Headshot AI API is running',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

export default router;