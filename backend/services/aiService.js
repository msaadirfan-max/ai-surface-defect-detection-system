const express = require("express");
const axios = require("axios");
const app = express();
const FormData = require("form-data");

// Forward the image to the FastAPI server for prediction
const forwardToFastApi = async (imageBuffer, originalFileName, mimeType) => {
  const fastApiUrl = process.env.FASTAPI_URL;

  try {
    // Create a FormData object to send the image
    const formData = new FormData();
    // Append the image buffer with the original filename and MIME type
    formData.append("file", imageBuffer, { 
      filename: originalFileName,
      contentType: mimeType,
    });

    // Send the request to the FastAPI server
    const response = await axios.post(`${fastApiUrl}/predict-explain`, formData, {
      headers: formData.getHeaders(),
    });
    return {
      status: response.data.status,
      confidence: response.data.confidence,
      inferenceTime: response.data.inference_time_ms,
      gradCamUrl: response.data.gradcam_image,
    };
  } catch (error) {
    console.error("Error forwarding to FastAPI:", error.message);
    if (error.response) {
      throw new Error(
        `AI Server Rejected Request: ${error.response.data.detail || error.message}`,
      );
    } else if (error.request) {
      throw new Error("No response received from AI server.");
    } else {
      throw new Error(`Error in request setup: ${error.message}`);
    }
  }
};

module.exports = {
  forwardToFastApi,
};
