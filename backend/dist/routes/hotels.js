"use strict";
/**
 * @swagger
 * tags:
 *   name: Hotels
 *   description: Hotel related endpoints
 */
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
const express_1 = __importDefault(require("express"));
const hotel_1 = __importDefault(require("../models/hotel"));
const history_1 = __importDefault(require("../models/history"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const auth_1 = __importDefault(require("../middleware/auth"));
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY);
const router = express_1.default.Router();
/**
 * @swagger
 * /api/hotels/search:
 *   get:
 *     summary: Search hotels
 *     description: Search for hotels based on various criteria
 *     tags: [Hotels]
 *     parameters:
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Destination city or country
 *       - in: query
 *         name: adultCount
 *         schema:
 *           type: integer
 *         description: Number of adults
 *       - in: query
 *         name: childCount
 *         schema:
 *           type: integer
 *         description: Number of children
 *       - in: query
 *         name: facilities
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of required facilities
 *       - in: query
 *         name: types
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of hotel types
 *       - in: query
 *         name: stars
 *         schema:
 *           type: array
 *           items:
 *             type: integer
 *         description: Array of hotel star ratings
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *         description: Maximum price per night
 *       - in: query
 *         name: sortOption
 *         schema:
 *           type: string
 *         description: Sorting option
 *     responses:
 *       '200':
 *         description: Successfully retrieved hotels
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HotelSearchResponse'
 *       '500':
 *         description: Internal server error
 */
// Define a route handler for GET requests to "/search"
router.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Construct the search query based on the request query parameters
        const query = constructSearchQuery(req.query);
        // Initialize an object to hold sorting options
        let sortOptions = {};
        // Determine sorting options based on the "sortOption" query parameter
        switch (req.query.sortOption) {
            case "starRating":
                sortOptions = { starRating: -1 }; // Sort by star rating in descending order
                break;
            case "pricePerNightAsc":
                sortOptions = { pricePerNight: 1 }; // Sort by price per night in ascending order
                break;
            case "pricePerNightDesc":
                sortOptions = { pricePerNight: -1 }; // Sort by price per night in descending order
                break;
        }
        // Define pagination parameters
        const pageSize = 5; // Number of items per page
        const pageNumber = parseInt(req.query.page ? req.query.page.toString() : "1" // Current page number, default to 1 if not provided
        );
        query.status = "approve";
        // Calculate the number of documents to skip based on pagination
        const skip = (pageNumber - 1) * pageSize;
        // Query the database to find hotels based on the constructed query, sorted and paginated
        const hotels = yield hotel_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);
        // Count total number of documents that match the query
        const total = yield hotel_1.default.countDocuments(query);
        // Construct the response object with retrieved hotels and pagination information
        const response = {
            data: hotels,
            pagination: {
                total,
                page: pageNumber,
                pages: Math.ceil(total / pageSize),
            },
        };
        res.json(response);
    }
    catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get all hotels
 *     description: Retrieve all approved hotels
 *     tags: [Hotels]
 *     responses:
 *       '200':
 *         description: Successfully retrieved hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Hotel'
 *       '500':
 *         description: Internal server error
 */
router.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ status: "approve" }).sort("-lastUpdated");
        res.json(hotels);
    }
    catch (error) {
        console.log("error", error);
        res.status(500).json({ message: "Error fetching hotels" });
    }
}));
/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get hotel by ID
 *     description: Retrieve a hotel by its ID
 *     tags: [Hotels]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Hotel ID
 *     responses:
 *       '200':
 *         description: Successfully retrieved the hotel
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Hotel'
 *       '400':
 *         description: Invalid hotel ID
 *       '404':
 *         description: Hotel not found
 *       '500':
 *         description: Internal server error
 */
router.get("/:id", [(0, express_validator_1.param)("id").notEmpty().withMessage("Hotel ID is required")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const id = req.params.id.toString();
    try {
        const hotel = yield hotel_1.default.findById(id);
        if (!hotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.json(hotel);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching hotel" });
    }
}));
/**
 * @swagger
 * /api/hotels/{hotelId}/bookings/payment-intent:
 *   post:
 *     summary: Create payment intent for hotel booking
 *     description: Create a payment intent for booking a hotel
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               numberOfNights:
 *                 type: integer
 *     responses:
 *       '200':
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 paymentIntentId:
 *                   type: string
 *                 clientSecret:
 *                   type: string
 *                 totalCost:
 *                   type: number
 *       '400':
 *         description: Invalid request or hotel not found
 *       '500':
 *         description: Internal server error
 */
router.post("/:hotelId/bookings/payment-intent", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { numberOfNights } = req.body;
    // Extract numberOfNights and hotelId from the request body and parameters
    const hotelId = req.params.hotelId;
    const hotel = yield hotel_1.default.findById(hotelId);
    if (!hotel) {
        return res.status(400).json({ message: "Hotel not found" });
    }
    //total cost caculate it gives us most up to date price
    const totalCost = hotel.pricePerNight * numberOfNights;
    // Create a payment intent with the total cost
    const paymentIntent = yield stripe.paymentIntents.create({
        amount: totalCost * 100,
        currency: "gbp",
        metadata: {
            hotelId,
            userId: req.userId,
        },
    });
    if (!paymentIntent.client_secret) {
        return res.status(500).json({ message: "Error creating payment intent" });
    }
    const scr = paymentIntent.client_secret.toString();
    console.log(scr);
    const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: scr,
        totalCost,
    };
    res.send(response);
}));
/**
 * @swagger
 * /api/hotels/{hotelId}/bookings:
 *   post:
 *     summary: Book a hotel
 *     description: Book a hotel after creating a payment intent
 *     tags: [Hotels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         schema:
 *           type: string
 *         required: true
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentIntentId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Hotel booked successfully
 *       '400':
 *         description: Invalid request or payment intent mismatch
 *       '500':
 *         description: Internal server error
 */
router.post("/:hotelId/bookings", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Retrieve the payment intent ID from the request body
        const paymentIntentId = req.body.paymentIntentId;
        // Retrieve payment intent details from Stripe using the payment intent ID
        const paymentIntent = yield stripe.paymentIntents.retrieve(paymentIntentId);
        if (!paymentIntent) {
            return res.status(400).json({ message: "payment intent not found" });
        }
        // Check if payment intent matches the hotel and user IDs
        if (paymentIntent.metadata.hotelId !== req.params.hotelId ||
            paymentIntent.metadata.userId !== req.userId) {
            return res.status(400).json({ message: "payment intent mismatch" });
        }
        if (paymentIntent.status !== "succeeded") {
            return res.status(400).json({
                message: `payment intent not succeeded. Status: ${paymentIntent.status}`,
            });
        }
        // Create a new booking object based on request body and authenticated user ID
        const newBooking = Object.assign(Object.assign({}, req.body), { userId: req.userId });
        // Find the hotel by ID and update it to add the new booking and decrease the booking limit
        const hotel = yield hotel_1.default.findOneAndUpdate({ _id: req.params.hotelId }, {
            $push: { bookings: newBooking },
            $inc: { limit: -1 }, // Decrease booking limit by 1
        });
        if (!hotel) {
            return res.status(400).json({ message: "hotel not found" });
        }
        yield hotel.save();
        // Create a history record for the new booking
        const history = Object.assign(Object.assign({}, newBooking), { name: hotel.name });
        yield history_1.default.create(history);
        res.status(200).send();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
const constructSearchQuery = (queryParams) => {
    let constructedQuery = {};
    if (queryParams.destination) {
        constructedQuery.$or = [
            { city: new RegExp(queryParams.destination, "i") },
            { country: new RegExp(queryParams.destination, "i") },
        ];
    }
    if (queryParams.adultCount) {
        constructedQuery.adultCount = {
            $gte: parseInt(queryParams.adultCount),
        };
    }
    if (queryParams.childCount) {
        constructedQuery.childCount = {
            $gte: parseInt(queryParams.childCount),
        };
    }
    if (queryParams.facilities) {
        constructedQuery.facilities = {
            $all: Array.isArray(queryParams.facilities)
                ? queryParams.facilities
                : [queryParams.facilities],
        };
    }
    if (queryParams.types) {
        constructedQuery.type = {
            $in: Array.isArray(queryParams.types)
                ? queryParams.types
                : [queryParams.types],
        };
    }
    if (queryParams.stars) {
        const starRatings = Array.isArray(queryParams.stars)
            ? queryParams.stars.map((star) => parseInt(star))
            : parseInt(queryParams.stars);
        constructedQuery.starRating = { $in: starRatings };
    }
    if (queryParams.maxPrice) {
        constructedQuery.pricePerNight = {
            $lte: parseInt(queryParams.maxPrice).toString(),
        };
    }
    return constructedQuery;
};
exports.default = router;
