import { Response } from "express";
import httpStatus from "http-status";
import { AuthenticatedRequest } from "@/middlewares";
import accommodationService from "@/services/accommodations-service";
import ticketService from "@/services/tickets-service";
import { TicketStatus } from "@prisma/client";

export async function getAllHotels(req: AuthenticatedRequest, res: Response) {
  const userId = Number(req.userId);

  try {
    const ticket = await ticketService.getTicketByUserId(userId);
    if(!ticket.TicketType.includesHotel || ticket.status === TicketStatus.RESERVED) return res.sendStatus(httpStatus.FORBIDDEN);

    const hotels = await accommodationService.getAllHotels();
    return res.send(hotels);
  } catch (error) {
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}

export async function getHotelRoomsById(req: AuthenticatedRequest, res: Response) {
  const userId = req.userId;
  const hotelId = Number(req.params.hotelId);
  if(!hotelId) res.sendStatus(httpStatus.BAD_REQUEST);

  try {
    const ticket = await ticketService.getTicketByUserId(userId);
    if(!ticket.TicketType.includesHotel || ticket.status === TicketStatus.RESERVED) return res.sendStatus(httpStatus.FORBIDDEN);

    const hotelRooms = await accommodationService.getHotelRoomsById(hotelId);
    return res.send(hotelRooms);
  } catch (error) {
    if(error.name === "NotFoundError") return res.sendStatus(httpStatus.NOT_FOUND);
    return res.sendStatus(httpStatus.NO_CONTENT);
  }
}
