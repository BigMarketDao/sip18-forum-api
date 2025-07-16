import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import { forumRoutes } from "./routes/forum/forumRoutes.js";
import { getConfig, printConfig, setConfigOnStart } from "./lib/config.js";
import { connect } from "./lib/data/db_models.js";

if (process.env.NODE_ENV === "development") {
  dotenv.config();
}

const app = express();
const port = process.env.PORT || 3025;
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:8060", "http://localhost:8080", "http://localhost:8081", "https://brightblock.org", "https://bigmarket.ai", "https://dao.bigmarket.ai"],
  })
);

app.use(morgan("tiny"));
app.use(express.static("public"));
app.use(cors());
setConfigOnStart();

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use((req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "DELETE") {
    next();
  } else {
    next();
  }
});

app.use("/bigmarket-api/forum", forumRoutes);

console.log(`\n\nExpress is listening at http://localhost:${getConfig().port}`);
console.log("Startup Environment: ", process.env.NODE_ENV);

async function connectToMongoCloud() {
  printConfig();
  await connect();
  console.log("Connected to MongoDB!");

  const server = app.listen(getConfig().port, () => {
    console.log("Server listening!");
    return;
  });
}

connectToMongoCloud();
