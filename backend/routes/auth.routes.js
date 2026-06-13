import {Router} from "express";
import { loginController, registerController } from "../controllers/auth.controller.js";

const router = Router();

router
    .route("/api/auth/register")
    .post(registerController)

router
    .route("/api/auth/login")
    .post(loginController)