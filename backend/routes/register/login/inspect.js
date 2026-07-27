const express = require("express");
const router = express.Router();
const uploadMiddleware = require("../../../middleware/upload");
const authMiddleware = require("../../../middleware/auth");
const { forwardToFastApi } = require("../../../services/aiService");
const Inspection = require("../../../models/Inspection");
const fs = require("fs");

router.post(
  "/",
  authMiddleware,
  uploadMiddleware.single("file"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    try {
      const imageBuffer = fs.readFileSync(
        req.file.path,
      ); // Read the uploaded file into a buffer 

      const aiResponse = await forwardToFastApi(
        // Send the image buffer to the FastAPI service for processing
        imageBuffer,
        req.file.originalname,
        req.file.mimetype,
      );

      // Construct the URL for the uploaded image based on the server's protocol, host, and the filename
      const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`; 

      // Construct a new inspection record in the database with the user ID, image URL, and AI response data
      const inspection = await Inspection.create({         
        userId: req.user.userId,
        imageUrl: imageUrl,
        status: aiResponse.status,
        confidence: aiResponse.confidence,
        inferenceTimeMs: aiResponse.inferenceTime,
        gradCamUrl: aiResponse.gradCamUrl,
      });

      return res.status(200).json({
        success: true,
        inspection,
      });
    } catch (error) {
      if (req.file && req.file.path) {
        fs.unlink(req.file.path, () => {});
      }
      next(error);
    }
  },
);

module.exports = router;
