const express = require("express");
const { ObjectId } = require("mongodb");
const { getDB } = require("../config/db");
const { authenticateToken } = require("../middleware/auth");
const appEvents = require("../events/appEvents");

const router = express.Router();
router.use(authenticateToken);

// GET /api/notes - return only the logged-in user's notes.
router.get("/", async (req, res, next) => {
  try {
    const notes = await getDB().collection("notes")
      .find({ ownerId: req.user.id })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(notes);
  } catch (error) { next(error); }
});

// POST /api/notes - create a note owned by the logged-in user.
router.post("/", async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const note = {
      title: title.trim(),
      content: content.trim(),
      ownerId: req.user.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await getDB().collection("notes").insertOne(note);
    const savedNote = { _id: result.insertedId, ...note };
    appEvents.emit("note:created", { ownerId: req.user.id, title: note.title });
    res.status(201).json(savedNote);
  } catch (error) { next(error); }
});

// PUT /api/notes/:id - update only a note owned by this user.
router.put("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid note id" });
    }
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: "title and content are required" });
    }

    const result = await getDB().collection("notes").findOneAndUpdate(
      { _id: new ObjectId(req.params.id), ownerId: req.user.id },
      { $set: { title: title.trim(), content: content.trim(), updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) return res.status(404).json({ message: "Note not found" });
    res.json(result);
  } catch (error) { next(error); }
});

// DELETE /api/notes/:id - delete only a note owned by this user.
router.delete("/:id", async (req, res, next) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid note id" });
    }
    const result = await getDB().collection("notes").deleteOne({
      _id: new ObjectId(req.params.id),
      ownerId: req.user.id
    });
    if (!result.deletedCount) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted successfully" });
  } catch (error) { next(error); }
});

module.exports = router;
