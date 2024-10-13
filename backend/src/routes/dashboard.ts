import express, { Request, Response } from "express";
import User from "../models/user";
import Hotel from "../models/hotel";
import History from "../models/history";
import Emergency from "../models/emergency";
import { check, validationResult } from "express-validator";
import verifyToken from "../middleware/auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail from "../routes/send-emails";
import Admin from "../models/admin";

const router = express.Router();
router.get("/create/:email/:password", async (req: Request, res: Response) => {
  const { email, password } = req.params;
  let checkUserValid = await Admin.findOne({
    email: req.body.email,
  });

  if (checkUserValid) {
    return res.status(400).json({ message: "User already exists" });
  }
  const admin = new Admin({
    email,
    password,
  });
  try {
    await admin.save();
    console.log("Admin created successfully");
    res.status(200).json({ message: "Admin created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid Credentials: email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid Credentials: password" });
    }
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: "1d",
      }
    );

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
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
router.post("/latestHistory", async (req: Request, res: Response) => {
  try {
    // get 10 latest booking
    const bookingTrans = await History.find()
      .sort({ createdAt: -1 })
      .limit(10)
    // .populate("name", "name")
    // .populate("userId", "firstName lastName");
    // console.log("🚀 ~ router.post ~ data:", bookingTrans)

    if (!bookingTrans) {
      console.error("Error:", "not find any lastest history in system");
    } else {
      res.status(200).json({ result: bookingTrans });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});
router.post("/info", async (req: Request, res: Response) => {
  try {
    // count all hotels
    const count = await Hotel.countDocuments({});
    // sum all totalCost in history
    const saleObtained = await History.aggregate([
      { $group: { _id: null, total: { $sum: "$totalCost" } } },
    ]);
    const sale = saleObtained.length > 0 ? saleObtained[0].total : 0;
    // count all users
    const userCount = await User.countDocuments({ role: { $ne: "admin" } });
    // count all bookings
    const bookingCount = await History.countDocuments({});
    const bookingTrans = await History.find()
      .sort({ createdAt: -1 })
      .limit(10)
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
    } else {
      res.status(200).json({ result: data });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.post("/profile", async (req: Request, res: Response) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }).select(
      "-password"
    );
    //get the user but do not need the password
    if (!users) {
      return res.status(400).json({ message: "Users not found" });
    }
    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.put("/profile/:profile_id", async (req: Request, res: Response) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.profile_id },
      { $set: req.body },
      { new: true }
    );
    const user = await User.findById(req.params.profile_id).select("-password");
    if (user && user._id) {
      user.id = user._id;
    }

    res.json(user);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.delete("/profile/:profile_id", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find({ userId: req.params.profile_id });
    if (hotels.length > 0) {
      // delete all hotels of user
      await Hotel.deleteMany({ userId: req.params.profile_id });
    }
    await User.findByIdAndDelete(req.params.profile_id);
    res.json({ message: "delete success" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get("/hotel", async (req: Request, res: Response) => {
  try {
    const hotels = await Hotel.find();
    if (!hotels) {
      return res.status(400).json({ message: "Hotels not found" });
    }
    res.json(hotels);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get("/booking", async (req: Request, res: Response) => {
  try {
    const result = await History.find();
    if (!result) {
      return res.status(400).json({ message: "History not found" });
    }
    res.json(result);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.put("/hotel/:hotel_id", async (req: Request, res: Response) => {
  try {
    const updatedHotel = await Hotel.findOneAndUpdate(
      { _id: req.params.hotel_id },
      { $set: req.body },
      { new: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res.json(updatedHotel);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Something went wrong with updating the hotel" });
  }
});

router.delete("/hotel/:hotel_id", async (req: Request, res: Response) => {
  try {
    await Hotel.findByIdAndDelete(req.params.hotel_id);
    res.json({ message: "Delete hotel success" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "something went wrong with delete hotel " });
  }
});

router.put("/emergency", async (req: Request, res: Response) => {
  try {
    const isEmergency = req.body.emergency;
    await Emergency.updateMany({}, { $set: { isEmergency: isEmergency } });

    const priceChange = req.body.emergency ? 0.6 : 1 / 0.6;
    const result = await Hotel.updateMany(
      { emergency: true },
      { $mul: { pricePerNight: priceChange } },
      { writeConcern: { w: 1 } }
    );
    if (!result) {
      return res.status(400).json({ message: "Cannot update hotel price" });
    }
    const hotels = await Hotel.find();
    //get the user but do not need the password
    if (!hotels) {
      return res.status(400).json({ message: "Hotels not found" });
    }
    res.json(hotels);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.get("/emergency", async (req: Request, res: Response) => {
  try {
    const isEmergency = await Emergency.find();
    if (!isEmergency) {
      return res.status(400).json({ message: "emergency not set" });
    }
    res.json(isEmergency[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong with emergency" });
  }
});

router.put("/emergency", async (req: Request, res: Response) => {
  try {
    const isEmergency = req.body.emergency;
    await Emergency.updateMany({}, { $set: { isEmergency: isEmergency } });

    const priceChange = req.body.emergency ? 0.6 : 1 / 0.6;
    const result = await Hotel.updateMany(
      { emergency: true },
      { $mul: { pricePerNight: priceChange } },
      { writeConcern: { w: 1 } }
    );
    if (!result) {
      return res.status(400).json({ message: "Cannot update hotel price" });
    }
    const hotels = await Hotel.find();
    //get the user but do not need the password
    if (!hotels) {
      return res.status(400).json({ message: "Hotels not found" });
    }
    res.json(hotels);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "something went wrong" });
  }
});

router.post("/email", async (req: Request, res: Response) => {
  try {
    // await sendEmail(); // Call the sendEmail function from your script
    const response = await sendEmail();
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ message: "Failed to send emails" });
  }
});
router.post("/email-order", async (req: Request, res: Response) => {
  try {
    // await sendEmail(); // Call the sendEmail function from your script
    const response = await sendEmail();
    res.status(200).json({ message: "Emails sent successfully" });
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).json({ message: "Failed to send emails" });
  }
});

export default router;
