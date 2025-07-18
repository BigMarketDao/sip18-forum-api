import express from "express";
import { AuthenticatedForumContent, ForumMessage, ForumMessageBoard, PostAuthorisation } from "sip18-forum-types";
import { buildTree, fetchThreadRecursive, saveMessageBoard, saveMessageOrReply, verifyPost } from "./forum_helper.js";
import { forumMessageBoardCollection, forumMessageCollection } from "../../lib/data/db_models.js";

const router = express.Router();

router.post("/message", async (req, res) => {
  try {
    const { forumContent, auth }: { forumContent: ForumMessage; auth: PostAuthorisation } = req.body;
    console.log(auth);
    console.log(forumContent);
    if (!forumContent || !auth.signature || !auth.publicKey) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    const result = verifyPost(forumContent, auth);
    if (result) await saveMessageOrReply({ forumContent, auth });
    else {
      res.status(401).json({ error: "Failed to verify the message" });
      return;
    }
    res.json(result);
    return;
  } catch (err) {
    console.error("Post verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/board", async (req, res) => {
  try {
    const { forumContent, auth }: { forumContent: ForumMessageBoard; auth: PostAuthorisation } = req.body;
    console.log(auth);
    console.log(forumContent);
    if (!forumContent || !auth.signature || !auth.publicKey) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }
    const result = verifyPost(forumContent, auth);
    if (result) await saveMessageBoard({ forumMessageBoard: forumContent, auth });
    else {
      res.status(401).json({ error: "Failed to verify the message" });
      return;
    }
    res.json(result);
  } catch (err) {
    console.error("Post verification error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/boards", async (req, res) => {
  try {
    console.log("Fetching boards: ");
    const data = await forumMessageBoardCollection.find({}).sort({ "forumMessageBoard.created": -1 }).toArray();
    console.log("Fetching boards: ", data);
    res.json(data);
  } catch (err) {
    console.error("Error fetching boards:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/board/:messageBoardId", async (req, res) => {
  try {
    console.log("Fetching boards: ");
    const data = await forumMessageBoardCollection.findOne({ "forumMessageBoard.messageBoardId": req.params.messageBoardId });
    console.log("Fetching boards: ", data);
    res.json(data);
  } catch (err) {
    console.error("Error fetching boards:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/board-messages/:boardId", async (req, res) => {
  try {
    const result = await forumMessageCollection.find({ "forumContent.messageBoardId": req.params.boardId }).sort({ "forumContent.created": -1 }).toArray();
    const messages = result as unknown as Array<AuthenticatedForumContent>;
    const treeData = buildTree(messages);
    res.json(treeData);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/messages/:messageId", async (req, res) => {
  try {
    const treeData = await fetchThreadRecursive(req.params.messageId, 3);
    res.json(treeData);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export { router as forumRoutes };
