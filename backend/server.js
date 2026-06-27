import express from "express";
import { errorResponse } from "./utils/response.utils.js"
import { env } from "./config/env.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Important for API

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