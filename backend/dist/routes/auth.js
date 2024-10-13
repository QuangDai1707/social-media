"use strict";
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints
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
const express_validator_1 = require("express-validator");
const user_1 = __importDefault(require("../models/user"));
const admin_1 = __importDefault(require("../models/admin"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const google_auth_library_1 = require("google-auth-library");
const router = express_1.default.Router();
/**
 * @swagger
 * /api/auth/admin:
 *   post:
 *     summary: Authenticate admin
 *     description: Authenticate admin using email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Admin authenticated successfully
 *       '400':
 *         description: Invalid credentials
 *       '500':
 *         description: Internal server error
 */
router.post("/admin", [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({
        min: 6,
    }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const admin = yield admin_1.default.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ adminId: admin.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
        });
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000,
        });
        res.status(200).json({ adminId: admin._id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
/**
 * @swagger
 * /api/auth/login/google:
 *   post:
 *     summary: Authenticate user with Google
 *     description: Authenticate user using Google OAuth2 token
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tokenId:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User authenticated successfully with Google
 *       '400':
 *         description: Invalid Google token payload
 *       '500':
 *         description: Google login failed
 */
router.post("/login/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { tokenId } = req.body;
    const googleClient = new google_auth_library_1.OAuth2Client('418140660178-4llvtgne2b4tqimo2op4of2bjf2ddq37.apps.googleusercontent.com');
    try {
        const ticket = yield googleClient.verifyIdToken({
            idToken: tokenId,
            audience: '418140660178-4llvtgne2b4tqimo2op4of2bjf2ddq37.apps.googleusercontent.com',
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ message: "Invalid Google token payload" });
        }
        const { email, given_name, family_name } = payload;
        let user = yield user_1.default.findOne({ email });
        if (!user) {
            // If user doesn't exist, create a new user
            user = new user_1.default({
                email,
                firstName: given_name,
                lastName: family_name,
                role: "user", // Assuming default role is user
                password: null
            });
            yield user.save();
        }
        else {
            // If user exists, update user information with Google data
            user.firstName = given_name;
            user.lastName = family_name;
            yield user.save();
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000,
        });
        res.status(200).json({ userId: user._id });
    }
    catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Google login failed" });
    }
}));
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user
 *     description: Authenticate user using email and password
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       '200':
 *         description: User authenticated successfully
 *       '400':
 *         description: Invalid credentials
 *       '500':
 *         description: Internal server error
 */
router.post("/login", [
    (0, express_validator_1.check)("email", "Email is required").isEmail(),
    (0, express_validator_1.check)("password", "Password with 6 or more characters required").isLength({
        min: 6,
    }),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    const { email, password } = req.body;
    try {
        const user = yield user_1.default.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, {
            expiresIn: "1d",
        });
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000,
        });
        res.status(200).json({ userId: user._id });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: Validate token
 *     description: Validate user token
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Token is valid
 *       '400':
 *         description: User not found
 */
router.get("/validate-token", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_1.default.findOne({ _id: req.userId });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    res.status(200).send({ role: user.role });
}));
router.post("/logout", (req, res) => {
    res.cookie("auth_token", "", {
        expires: new Date(0),
    });
    res.send();
});
// // Route to verify the user's email
// router.get('/verify', async (req, res) => {
//   try {
//     const user = await User.findOne({ verificationToken: req.query.token });
//     if (!user) {
//       return res.status(400).send('Invalid verification token');
//     }
//     user.verified = true;
//     await User.updateOne({ _id: user._id }, { $unset: { verificationToken: 1 }, $set: { verified: true } });
//     await user.save();
//     res.send('Email verified successfully');
//   } catch (error) {
//     res.status(500).send('Server error');
//   }
// });
exports.default = router;
