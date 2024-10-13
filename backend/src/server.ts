import express from "express";
import { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import myHotelRoutes from "./routes/my-hotels";
import hotelRoutes from "./routes/hotels";
import bookingRoutes from "./routes/my-bookings";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

import { startProducing } from './streaming/producer';


// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// })

// mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [process.env.FRONTEND_URL?process.env.FRONTEND_URL:""],
    credentials: true,
  })
);

app.get("/api/test", (req: Request, res: Response) => {
  res.json({ message: "hello from express endpoint!" });
});


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/my-hotels", myHotelRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/dashboard", dashboardRoutes)
app.use("/api/my-bookings", bookingRoutes);

// Swagger configuration
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Your API",
      version: "1.0.0",
      description: "API Documentation",
    },
    servers: [
      {
        url: process.env.BACKEND_URL,
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.ts"], // Adjust the path according to your directory structure
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("*", (req: Request, res: Response) => {
  res.json({'username':'abcdefg'});
});

app.get("/stream", (req: Request, res: Response) => {
  startProducing().catch((err) => {
    console.error('Error starting the producer', err);
  });
});

app.listen(7000, () => {
  console.log("server running on localhost:7000");
});