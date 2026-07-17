const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth");
const checkUserRole = require("../middleware/role");
const Inspection = require("../models/Inspection");
const User = require("../models/User");

router.use(authMiddleware, checkUserRole);

router.get("/stats", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [stats, totalUsers] = await Promise.all([
      Inspection.aggregate([
        {
          $facet: {
            globalMetrics: [
              {
                $group: {
                  _id: null,
                  totalCount: { $sum: 1 },
                  averageConfidence: { $avg: "$confidence" },
                },
              },
            ],
            defectiveMetrics: [
              { $match: { status: "defective" } },
              { $count: "defectiveCount" },
            ],
            dailyCounts: [
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      User.countDocuments(),
    ]);

    const global = stats[0].globalMetrics[0] || {
      totalCount: 0,
      averageConfidence: 0,
    };
    const defective = stats[0].defectiveMetrics[0] || { defectiveCount: 0 };
    const dailyCounts = stats[0].dailyCounts || [];

    return res.status(200).json({
      totalInspections: global.totalCount,
      defectiveCount: defective.defectiveCount,
      averageConfidence: global.averageConfidence,
      totalUsers,
      countsGroupedByDate: dailyCounts,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error occurred while fetching admin data" });
  }
});

// ─────────────────────────────────────────────
// 2. GET /admin/inspections (Global Paginated History)
// ─────────────────────────────────────────────
router.get("/inspections", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [inspections, totalCount] = await Promise.all([
      Inspection.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        // Populates the user details field matching name and email requirements
        .populate("userId", "name email"),
      Inspection.countDocuments(),
    ]);

    return res.status(200).json({
      inspections,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching global inspection history" });
  }
});

// ─────────────────────────────────────────────
// 3. GET /admin/users (User Listing)
// ─────────────────────────────────────────────
router.get("/users", async (req, res) => {
  try {
    // Select specific fields explicitly to ensure password hashes are NEVER leaked
    const users = await User.find({}, "name email role createdAt");
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching system users" });
  }
});

// ─────────────────────────────────────────────
// 4. PATCH /admin/users/:id/role (Role Management)
// ─────────────────────────────────────────────
router.patch("/users/:id/role", async (req, res) => {
  const { role } = req.body;

  // Validate the incoming role value explicitly
  if (!["user", "admin"].includes(role)) {
    return res
      .status(400)
      .json({ error: "Invalid role specified. Must be 'user' or 'admin'." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role: role },
      { new: true, runValidators: true },
    ).select("name email role");

    if (!updatedUser) {
      return res.status(404).json({ error: "Target user record not found" });
    }

    return res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error updating user privileges" });
  }
});

// Micro-helper to manage clean rounding rules safely
function roundTo(num, places) {
  return +(Math.round(num + "e+" + places) + "e-" + places) || 0;
}

module.exports = router;
