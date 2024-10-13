"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel management endpoints
 */
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const hotel_1 = __importDefault(require("../models/hotel"));
const user_1 = __importDefault(require("../models/user"));
const auth_1 = __importDefault(require("../middleware/auth"));
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
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
router.post("/", auth_1.default, [
    (0, express_validator_1.body)("name").notEmpty().withMessage("Name is required"),
    (0, express_validator_1.body)("city").notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("country").notEmpty().withMessage("Country is required"),
    (0, express_validator_1.body)("description").notEmpty().withMessage("Description is required"),
    (0, express_validator_1.body)("type").notEmpty().withMessage("Hotel type is required"),
    (0, express_validator_1.body)("limit").notEmpty().withMessage("Limit is required"),
    (0, express_validator_1.body)("emergency").notEmpty().withMessage("Emergency is required"),
    (0, express_validator_1.body)("pricePerNight")
        .notEmpty()
        .isNumeric()
        .withMessage("Price per night is required and must be a number"),
    (0, express_validator_1.body)("facilities")
        .notEmpty()
        .isArray()
        .withMessage("Facilities are required"),
], upload.array("imageFiles", 6), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imageFiles = req.files;
        req.body.emergency = req.body.emergency === "Yes" ? "true" : "false";
        req.body.status = "pending";
        const newHotel = req.body;
        // Upload the images to cloudinary
        const imageUrls = yield uploadImages(imageFiles);
        newHotel.imageUrls = imageUrls;
        newHotel.lastUpdated = new Date();
        newHotel.userId = req.userId;
        // save the new hotel in the database
        const hotel = new hotel_1.default(newHotel);
        user_1.default.updateOne({ id: req.userId }, {
            $set: { role: "owner" }
        });
        yield hotel.save();
        // return 201 status
        res.status(201).send(hotel);
    }
    catch (e) {
        console.log(e);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
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
router.get("/", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ userId: req.userId });
        res.json(hotels);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
router.get("/history-bookings", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ userId: req.userId });
        res.json(hotels);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
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
router.get("/:id", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // /api/my-hotels/id
    const id = req.params.id.toString();
    try {
        const hotel = yield hotel_1.default.findOne({
            _id: id,
            userId: req.userId,
        });
        res.json(hotel);
    }
    catch (error) {
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
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
router.put("/:hotelId", auth_1.default, upload.array("imageFiles"), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedHotel = req.body;
        updatedHotel.lastUpdated = new Date();
        updatedHotel.status = "pending";
        const hotel = yield hotel_1.default.findOneAndUpdate({
            _id: req.params.hotelId,
            userId: req.userId,
        }, updatedHotel, { new: true });
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        const files = req.files;
        const updatedImageUrls = yield uploadImages(files);
        hotel.imageUrls = [
            ...updatedImageUrls,
            ...(updatedHotel.imageUrls || []),
        ];
        yield hotel.save();
        res.status(201).json(hotel);
    }
    catch (error) {
        res.status(500).json({ message: "Something went throw" });
    }
}));
function uploadImages(imageFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        // Map each image file to a promise that uploads it to the cloud storage
        const uploadPromises = imageFiles.map((image) => __awaiter(this, void 0, void 0, function* () {
            const b64 = Buffer.from(image.buffer).toString("base64");
            // Create a data URI for the image
            let dataURI = "data:" + image.mimetype + ";base64," + b64;
            // Upload the image to the cloud storage service 
            const res = yield cloudinary_1.default.v2.uploader.upload(dataURI);
            return res.url;
        }));
        const imageUrls = yield Promise.all(uploadPromises);
        return imageUrls;
    });
}
exports.default = router;
