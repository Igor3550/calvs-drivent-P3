import supertest from "supertest";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import faker from "@faker-js/faker";
import { createEnrollmentWithAddress, createTicket, createTicketType, createUser } from "../factories";
import { cleanDb, generateValidToken } from "../helpers";
import app, { init } from "@/app";
import { TicketStatus } from "@prisma/client";
import { prisma } from "@/config";

async function createHotels() {
  const hotels = [
    {
      name: faker.name.findName(),
      image: "https://pix10.agoda.net/hotelImages/124/1246280/1246280_16061017110043391702.jpg?ca=6&ce=1&s=1024x768"
    },
    {
      name: faker.name.findName(),
      image: "https://assets.hyatt.com/content/dam/hyatt/hyattdam/images/2017/08/29/1013/Grand-Hyatt-Rio-de-Janeiro-P443-Pool.jpg/Grand-Hyatt-Rio-de-Janeiro-P443-Pool.16x9.jpg?imwidth=1920"
    },
    {
      name: faker.name.findName(),
      image: "https://thumbcdn-z.hotelurbano.net/_DDFtBf8ruBMrYb4c1xVXEqzIdU=/444x270/center/middle/filters:quality(40)/https://novo-hu.s3.amazonaws.com/reservas/ota/prod/hotel/529028/enjoy-olimpia-park-resort-002_20191121131749.png"
    }
  ];

  return await prisma.hotel.createMany({
    data: hotels
  });
}

async function createTicketTypeWithHotel() {
  return prisma.ticketType.create({
    data: {
      name: faker.name.findName(),
      price: faker.datatype.number(),
      isRemote: false,
      includesHotel: true,
    },
  });
}

async function createUserWithTicketWithHotel() {
  const user = await createUser();
  const token = await generateValidToken(user);
  const enrollment = await createEnrollmentWithAddress(user);
  const ticketType = await createTicketTypeWithHotel();
  const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);

  return { token, ticket };
}

async function createHotelWithRooms() {
  const hotel = await prisma.hotel.create({
    data: {
      name: "DrivenHotel",
      image: "https://pix10.agoda.net/hotelImages/124/1246280/1246280_16061017110043391702.jpg?ca=6&ce=1&s=1024x768"
    }
  });
  await prisma.room.createMany({
    data: [
      {
        name: "01",
        capacity: 5,
        hotelId: hotel.id
      },
      {
        name: "02",
        capacity: 5,
        hotelId: hotel.id
      },
      {
        name: "03",
        capacity: 5,
        hotelId: hotel.id
      },
    ]
  });
  
  return hotel;
}

beforeAll(async () => {
  init();
});

beforeEach(async () => {
  await prisma.room.deleteMany({});
  await prisma.hotel.deleteMany({});
  await cleanDb();
});

const server = supertest(app);

describe("GET /hotels", () => {
  describe("when token is invalid", () => {
    it("should respond with status 401 if no token given", async () => {
      const response = await server.get("/hotels");
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is invalid", async () => {
      const token = faker.lorem.word();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("when token is valid", () => {
    it("should respond with status 403 if the ticket is not paid or does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });
    
    it("should respond with status 200 and available hotels data", async () => {
      await createHotels();
      const { token } = await createUserWithTicketWithHotel();

      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.OK);
      expect(response.body).toEqual(expect.arrayContaining([
        {
          id: expect.any(Number),
          name: expect.any(String),
          image: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String)
        }
      ]));
    });
  });
});

describe("GET /hotels/:hotelId", () => {
  describe("when token is invalid", () => {
    it("should respond with status 401 if no token given", async () => {
      const response = await server.get("/hotels");
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is invalid", async () => {
      const token = faker.lorem.word();
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
  
      const response = await server.get("/hotels").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  });

  describe("when token is valid", () => {
    it("should respond with status 403 if the user ticket is not paid or does not include hotel", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketType();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.FORBIDDEN);
    });

    it("should respond with status 404 if hotel id not exists", async () => {
      const { token } = await createUserWithTicketWithHotel();

      const response = await server.get("/hotels/1").set("Authorization", `Bearer ${token}`);
  
      expect(response.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 and rooms data", async () => {
      const { token } = await createUserWithTicketWithHotel();
      const hotel = await createHotelWithRooms();

      const response = await server.get(`/hotels/${hotel.id}`).set("Authorization", `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: hotel.id,
        name: hotel.name,
        image: hotel.image,
        Rooms: expect.arrayContaining([
          {
            id: expect.any(Number),
            name: expect.any(String),
            capacity: expect.any(Number),
            hotelId: expect.any(Number),
            createdAt: expect.any(String),
            updatedAt: expect.any(String)
          }
        ]),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
    });
  });
});
