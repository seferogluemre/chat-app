import { errorHandler } from "@/middlewares/error.middleware";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import { fileURLToPath } from "url";

const corsOptions = {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  credentials: true,
  maxAge: 86400,
};

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = createServer(app);

const __filename = fileURLToPath(import.meta.url);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Express Api running on port " + port);
});

app.use(errorHandler);

httpServer.listen(port, () => {
  console.log(`Express Sunucusu ${port} portunda çalışıyor...`);
});
