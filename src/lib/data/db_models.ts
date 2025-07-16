import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import type { Collection } from "mongodb";
import { getConfig, isDev } from "../config.js";

export let forumMessageCollection: Collection;
export let forumMessageBoardCollection: Collection;

export async function connect() {
  let uriPrefix: string = "mongodb+srv";
  if (isDev()) {
    uriPrefix = "mongodb";
  }
  const uri = `${uriPrefix}://${getConfig().mongoUser}:${getConfig().mongoPwd}@${getConfig().mongoDbUrl}/?retryWrites=true&w=majority`;

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  await client.db("admin").command({ ping: 1 });

  const database = client.db(getConfig().mongoDbName);

  forumMessageBoardCollection = database.collection("forumMessageBoardCollection");
  await forumMessageBoardCollection.createIndex({ "forumMessageBoard.messageBoardId": 1 }, { unique: true });

  forumMessageCollection = database.collection("forumMessageCollection");
  await forumMessageCollection.createIndex({ "forumContent.messageId": 1 }, { unique: true });
}
