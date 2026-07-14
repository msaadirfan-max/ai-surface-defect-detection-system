const express = require("express");
const routes = express.Router();

const Inspection = require("../../../models/Inspection");
const authMiddleware = require("../../../middleware/auth");

let array = [];

routes.get("/", authMiddleware, async (req, res,next) => {
  try {
    const query = {
      userId: req.user.userId,
    };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status || null;

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [inspections, totalCount] = await Promise.all([
      Inspection.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

routes.get("/:id", authMiddleware, async (req, res,next) => {
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
