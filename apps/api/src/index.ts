import { errorHandler } from "@/middlewares/error.middleware";
import cors from "cors";
import dotenv from "dotenv";
import express, { Router } from "express";
import helmet from "helmet";
import { createServer } from "http";
import morgan from 'morgan';
import { authRoutes } from "./modules/auth";

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

const router=Router();

app.use(errorHandler);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Logging
app.use(morgan('combined'))

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.use('/api', authRoutes);

app.use(router);

httpServer.listen(port, () => {
  console.log(`Express Sunucusu ${port} portunda çalışıyor...`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});