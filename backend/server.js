import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import RequestIp from "request-ip"
import { errorResponse } from "./utils/response.utils.js"
import { env } from "./config/env.js";

const app = express();

//security middlewares
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

//body parsing
app.use(express.json({limit: '10mb'})); // Important for API
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(RequestIp.mw()); //provides method req.clientIp

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json(errorResponse('Route not found', 404));
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json(errorResponse('Internal server error', 500));
});

app.listen(env.PORT, () => {
    console.log("server is running on port 3000")
});