import { prisma } from "@/config";

async function findAllHotels() {
  return prisma.hotel.findMany();
}

async function findHotelRoomsById(hotelId: number) {
  return prisma.hotel.findUnique({
    where: {
      id: hotelId
    },
    include: {
      Rooms: true
    }
  });
}

const accommodationRepository = {
  findAllHotels,
  findHotelRoomsById
};

export default accommodationRepository;
