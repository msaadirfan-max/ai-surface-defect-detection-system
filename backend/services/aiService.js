const express = require("express");
const axios = require("axios");
const app = express();
const FormData = require("form-data");

/*
@param {Buffer} imageBuffer - The image buffer to be sent to the AI service.
@param {string} originalFileName - The original file name of the image.
@param {string} mimeType - The MIME type(jpg/png) of the image.
*/

const forwardToFastApi = async (imageBuffer, originalFileName, mimeType) => {
  const fastApiUrl = process.env.FASTAPI_URL || "http://localhost:8000";

  try {
    const formData = new FormData();
    formData.append("file", imageBuffer, {
      filename: originalFileName,
      contentType: mimeType,
    });

    const response = await axios.post(`${fastApiUrl}/predict`, formData, {
      headers: formData.getHeaders(),
    });
    return {
      status: response.data.status,
      confidence: response.data.confidence,
      inferenceTime: response.data.inference_time_ms,
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
