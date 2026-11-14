const express = require("express");
const { getDB } = require("../config/db");
const { authenticateToken, requireAdmin } = require("../middleware/auth");

const router = express.Router();

// Both authentication and the admin role are required.
router.get("/users", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const users = await getDB().collection("users")
      .find({}, { projection: { passwordHash: 0 } })
      .toArray();
    res.json(users);
  } catch (error) { next(error); }
});

module.exports = router;
