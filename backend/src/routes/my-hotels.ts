/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel management endpoints
 */
import express, { Request, Response } from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import Hotel from "../models/hotel";
import User from "../models/user";
import verifyToken from "../middleware/auth";
import { body } from "express-validator";
import { HotelType } from "../shared/types";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/**
 * @swagger
 * /api/my-hotels:
 *   post:
 *     summary: Create a new hotel
 *     description: Create a new hotel with images
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               limit:
 *                 type: number
 *               emergency:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '201':
 *         description: Hotel created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.post(
  "/",
  verifyToken,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("type").notEmpty().withMessage("Hotel type is required"),
    body("limit").notEmpty().withMessage("Limit is required"),
    body("emergency").notEmpty().withMessage("Emergency is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price per night is required and must be a number"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities are required"),
  ],
  upload.array("imageFiles", 6),
  async (req: Request, res: Response) => {
    try {
      const imageFiles = req.files as Express.Multer.File[];
      req.body.emergency = req.body.emergency === "Yes" ? "true" : "false";
      req.body.status = "pending";
      const newHotel: HotelType = req.body;
      // Upload the images to cloudinary
      const imageUrls = await uploadImages(imageFiles);

      newHotel.imageUrls = imageUrls;
      newHotel.lastUpdated = new Date();
      newHotel.userId = req.userId;
      // save the new hotel in the database
      const hotel = new Hotel(newHotel);
      User.updateOne({ id: req.userId }, {
        $set: { role: "owner" }
      })
      await hotel.save();
      // return 201 status
      res.status(201).send(hotel);
    } catch (e) {
      console.log(e);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

/**
 * @swagger
 * /api/my-hotels:
 *   get:
 *     summary: Get user's hotels
 *     description: Retrieve hotels created by the authenticated user
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Successfully retrieved user's hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});


router.get("/history-bookings", verifyToken, async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.userId });
    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});

/**
 * @swagger
 * /api/my-hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     description: Retrieve hotel details by ID for the authenticated user
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the hotel to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully retrieved hotel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.get("/:id", verifyToken, async (req: Request, res: Response) => {
  // /api/my-hotels/id
  const id = req.params.id.toString();
  try {
    const hotel = await Hotel.findOne({
      _id: id,
      userId: req.userId,
    });
    res.json(hotel);
  } catch (error) {
    res.status(500).json({ message: "Error fetching hotels" });
  }
});


/**
 * @swagger
 * /api/my-hotels/{hotelId}:
 *   put:
 *     summary: Update hotel details
 *     description: Update hotel details by ID for the authenticated user
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         description: ID of the hotel to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               limit:
 *                 type: number
 *               emergency:
 *                 type: string
 *               pricePerNight:
 *                 type: number
 *               facilities:
 *                 type: array
 *                 items:
 *                   type: string
 *               imageFiles:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       '201':
 *         description: Hotel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelType'
 *       '500':
 *         description: Internal server error
 */
router.put(
  "/:hotelId",
  verifyToken,
  upload.array("imageFiles"),
  async (req: Request, res: Response) => {
    try {
      const updatedHotel: HotelType = req.body;
      updatedHotel.lastUpdated = new Date();
      updatedHotel.status = "pending";
      const hotel = await Hotel.findOneAndUpdate(
        {
          _id: req.params.hotelId,
          userId: req.userId,
        },
        updatedHotel,
        { new: true }
      );

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      const files = req.files as Express.Multer.File[];
      const updatedImageUrls = await uploadImages(files);

      hotel.imageUrls = [
        ...updatedImageUrls,
        ...(updatedHotel.imageUrls || []),
      ];

      await hotel.save();
      res.status(201).json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Something went throw" });
    }
  }
);

async function uploadImages(imageFiles: Express.Multer.File[]) {
  // Map each image file to a promise that uploads it to the cloud storage
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    // Create a data URI for the image
    let dataURI = "data:" + image.mimetype + ";base64," + b64;
    // Upload the image to the cloud storage service 
    const res = await cloudinary.v2.uploader.upload(dataURI);
    return res.url;
  });
  const imageUrls = await Promise.all(uploadPromises);

  return imageUrls;
}

export default router;