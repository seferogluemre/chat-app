import { errorMiddleware } from "@/middlewares/error.middleware";
import cors from "cors";
import dotenv from "dotenv";
import express, { Router } from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from "morgan";
import { authRoutes } from "./modules/auth";
import { membershipRoutes } from "./modules/memberships";
import { messageRoutes } from "./modules/messages";
import { roomRoutes } from "./modules/room";
import { initializeSocket } from "./modules/socket/service";
import { userRoutes } from "./modules/user";

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

const api = Router();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(morgan("combined"));

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

api.use("/auth", authRoutes);
api.use("/rooms", roomRoutes);
api.use("/users", userRoutes);
api.use("/messages", messageRoutes);
app.use('/memberships', membershipRoutes);

app.use("/api", api);

app.use(errorMiddleware);

initializeSocket(httpServer)

httpServer.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📡 Socket.io ready`);
});
