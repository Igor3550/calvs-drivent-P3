import { Router } from "express";
import { authenticateToken } from "@/middlewares";
import { getAllHotels, getHotelRoomsById } from "@/controllers/accommodations-controller";

const accommodationsRouter = Router();

accommodationsRouter
  .all("/", authenticateToken)
  .get("/", getAllHotels)
  .get("/:hotelId", getHotelRoomsById);

export { accommodationsRouter };
