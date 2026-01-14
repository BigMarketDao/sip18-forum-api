import express from "express";

const router = express.Router();

router.get("/", async (req, res) => {
  res.json({ result: "hi" });
});

export { router as healthRoutes };
