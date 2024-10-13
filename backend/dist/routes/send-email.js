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
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/user"); // Import your user model
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose.connect(process.env.MONGODB_URI || "mongodb+srv://tiny01:tiny02@tiny01.afppr0j.mongodb.net/?retryWrites=true&w=majority", {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            // Fetch all unverified users
            const unverifiedUsers = yield User.find({ verified: false });
            // Iterate over unverified users and send verification email
            for (const user of unverifiedUsers) {
                const transporter = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    port: 465,
                    secure: true,
                    auth: {
                        user: "santanguyen462@gmail.com",
                        pass: "sdmw wjch nxlj rtul",
                    },
                });
                // Generate verification token (you can use a library like `crypto` to generate random tokens)
                const verificationToken = generateVerificationToken();
                // Save verification token to user document
                user.verificationToken = verificationToken;
                yield user.save();
                // Send verification email
                const info = yield transporter.sendMail({
                    from: '"Sale off Tran Hotel" <santanguyen462@gmail.com>',
                    to: user.email,
                    subject: "Account Verification",
                    html: `
          <h1>Welcome to Tran Hotel</h1>
          <p>Please click the following link to verify your account:</p>
          <a href="http://yourdomain.com/verify?token=${verificationToken}">Verify Account</a>
        `,
                });
                console.log(info.messageId);
                console.log(info.accepted);
                console.log(info.rejected);
            }
        }
        catch (error) {
            console.error("Error:", error);
        }
        finally {
            yield mongoose.disconnect();
        }
    });
}
// Function to generate verification token
function generateVerificationToken() {
    // Implement your token generation logic here
}
main().catch((err) => console.log(err));
