import { notFoundError } from "@/errors";
import accommodationRepository from "@/repositories/accommodation-repository";

async function getAllHotels() {
  return await accommodationRepository.findAllHotels();
}

async function getHotelRoomsById(hotelId: number) {
  const hotelRooms = await accommodationRepository.findHotelRoomsById(hotelId);
  if(!hotelRooms) throw notFoundError();
  return hotelRooms;
}

const accommodationService = {
  getAllHotels,
  getHotelRoomsById
};

export default accommodationService;
