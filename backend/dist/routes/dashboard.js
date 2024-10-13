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
const express_1 = __importDefault(require("express"));
const user_1 = __importDefault(require("../models/user"));
const hotel_1 = __importDefault(require("../models/hotel"));
const history_1 = __importDefault(require("../models/history"));
const emergency_1 = __importDefault(require("../models/emergency"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const send_emails_1 = __importDefault(require("../routes/send-emails"));
const admin_1 = __importDefault(require("../models/admin"));
const router = express_1.default.Router();
router.get("/create/:email/:password", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.params;
    let checkUserValid = yield admin_1.default.findOne({
        email: req.body.email,
    });
    if (checkUserValid) {
        return res.status(400).json({ message: "User already exists" });
    }
    const admin = new admin_1.default({
        email,
        password,
    });
    try {
        yield admin.save();
        console.log("Admin created successfully");
        res.status(200).json({ message: "Admin created successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
router.post("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield admin_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials: email" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials: password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
        });
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000,
        });
        const data = {
            userInfo: {
                email: user.email,
            },
        };
        res.status(200).json({ data });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
router.post("/latestHistory", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get 10 latest booking
        const bookingTrans = yield history_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10);
        // .populate("name", "name")
        // .populate("userId", "firstName lastName");
        // console.log("🚀 ~ router.post ~ data:", bookingTrans)
        if (!bookingTrans) {
            console.error("Error:", "not find any lastest history in system");
        }
        else {
            res.status(200).json({ result: bookingTrans });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.post("/info", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // count all hotels
        const count = yield hotel_1.default.countDocuments({});
        // sum all totalCost in history
        const saleObtained = yield history_1.default.aggregate([
            { $group: { _id: null, total: { $sum: "$totalCost" } } },
        ]);
        const sale = saleObtained.length > 0 ? saleObtained[0].total : 0;
        // count all users
        const userCount = yield user_1.default.countDocuments({ role: { $ne: "admin" } });
        // count all bookings
        const bookingCount = yield history_1.default.countDocuments({});
        const bookingTrans = yield history_1.default.find()
            .sort({ createdAt: -1 })
            .limit(10);
        // .populate("name", "name")
        // .populate("userId", "firstName lastName");
        const data = {
            count,
            sale,
            userCount,
            bookingCount,
            bookingTrans
        };
        // console.log("🚀 ~ router.post ~ data:", data)
        if (!count) {
            console.error("Error:", "not find any hotel in system");
        }
        else {
            res.status(200).json({ result: data });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.post("/profile", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield user_1.default.find({ role: { $ne: "admin" } }).select("-password");
        //get the user but do not need the password
        if (!users) {
            return res.status(400).json({ message: "Users not found" });
        }
        res.json(users);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.put("/profile/:profile_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield user_1.default.findOneAndUpdate({ _id: req.params.profile_id }, { $set: req.body }, { new: true });
        const user = yield user_1.default.findById(req.params.profile_id).select("-password");
        if (user && user._id) {
            user.id = user._id;
        }
        res.json(user);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.delete("/profile/:profile_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find({ userId: req.params.profile_id });
        if (hotels.length > 0) {
            // delete all hotels of user
            yield hotel_1.default.deleteMany({ userId: req.params.profile_id });
        }
        yield user_1.default.findByIdAndDelete(req.params.profile_id);
        res.json({ message: "delete success" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.get("/hotel", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const hotels = yield hotel_1.default.find();
        if (!hotels) {
            return res.status(400).json({ message: "Hotels not found" });
        }
        res.json(hotels);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.get("/booking", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield history_1.default.find();
        if (!result) {
            return res.status(400).json({ message: "History not found" });
        }
        res.json(result);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.put("/hotel/:hotel_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedHotel = yield hotel_1.default.findOneAndUpdate({ _id: req.params.hotel_id }, { $set: req.body }, { new: true });
        if (!updatedHotel) {
            return res.status(404).json({ message: "Hotel not found" });
        }
        res.json(updatedHotel);
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: "Something went wrong with updating the hotel" });
    }
}));
router.delete("/hotel/:hotel_id", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield hotel_1.default.findByIdAndDelete(req.params.hotel_id);
        res.json({ message: "Delete hotel success" });
    }
    catch (error) {
        console.log(error);
        res
            .status(500)
            .json({ message: "something went wrong with delete hotel " });
    }
}));
router.put("/emergency", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isEmergency = req.body.emergency;
        yield emergency_1.default.updateMany({}, { $set: { isEmergency: isEmergency } });
        const priceChange = req.body.emergency ? 0.6 : 1 / 0.6;
        const result = yield hotel_1.default.updateMany({ emergency: true }, { $mul: { pricePerNight: priceChange } }, { writeConcern: { w: 1 } });
        if (!result) {
            return res.status(400).json({ message: "Cannot update hotel price" });
        }
        const hotels = yield hotel_1.default.find();
        //get the user but do not need the password
        if (!hotels) {
            return res.status(400).json({ message: "Hotels not found" });
        }
        res.json(hotels);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.get("/emergency", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isEmergency = yield emergency_1.default.find();
        if (!isEmergency) {
            return res.status(400).json({ message: "emergency not set" });
        }
        res.json(isEmergency[0]);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong with emergency" });
    }
}));
router.put("/emergency", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isEmergency = req.body.emergency;
        yield emergency_1.default.updateMany({}, { $set: { isEmergency: isEmergency } });
        const priceChange = req.body.emergency ? 0.6 : 1 / 0.6;
        const result = yield hotel_1.default.updateMany({ emergency: true }, { $mul: { pricePerNight: priceChange } }, { writeConcern: { w: 1 } });
        if (!result) {
            return res.status(400).json({ message: "Cannot update hotel price" });
        }
        const hotels = yield hotel_1.default.find();
        //get the user but do not need the password
        if (!hotels) {
            return res.status(400).json({ message: "Hotels not found" });
        }
        res.json(hotels);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong" });
    }
}));
router.post("/email", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // await sendEmail(); // Call the sendEmail function from your script
        const response = yield (0, send_emails_1.default)();
        res.status(200).json({ message: "Emails sent successfully" });
    }
    catch (error) {
        console.error("Error sending emails:", error);
        res.status(500).json({ message: "Failed to send emails" });
    }
}));
router.post("/email-order", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // await sendEmail(); // Call the sendEmail function from your script
        const response = yield (0, send_emails_1.default)();
        res.status(200).json({ message: "Emails sent successfully" });
    }
    catch (error) {
        console.error("Error sending emails:", error);
        res.status(500).json({ message: "Failed to send emails" });
    }
}));
exports.default = router;
