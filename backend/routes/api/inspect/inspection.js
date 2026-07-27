const express = require("express");
const routes = express.Router();

const Inspection = require("../../../models/Inspection");
const authMiddleware = require("../../../middleware/auth");

let array = [];

// History of inspections for the logged-in user with pagination and optional status filter
routes.get("/", authMiddleware, async (req, res, next) => {
  try {
    // Build the query object based on the logged-in user and optional status filter
    const query = {
      userId: req.user.userId,
    };

    // Pagination parameters
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Limit 10
    const status = req.query.status || null;

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit; // Calculate the number of documents to skip for pagination

    // Fetch inspections and total count in parallel
    const [inspections, totalCount] = await Promise.all([
      Inspection.find(query)
        .populate("userId", "username email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Inspection.countDocuments(query),
    ]);

    array = inspections;
    return res.status(200).json({
      inspections,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific inspection by ID, ensuring the logged-in user is the owner
routes.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    const inspection = await Inspection.findById(req.params.id);
    if (!inspection) {
      return res.status(404).json({ message: "Inspection not found" });
    }

    if (inspection.userId.toString() === req.user.userId) {
      res.status(200).json(inspection);
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = routes;
