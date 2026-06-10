import { Router } from "express";
import * as eventsController from "./events.controller.js";

export const eventsRouter = Router();

// SSE público: stream de cambios de stock y productos en tiempo real
eventsRouter.get("/stream", eventsController.stream);
