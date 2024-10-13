"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const emergencySchema = new mongoose_1.default.Schema({
    isEmergency: { type: Boolean, required: true },
});
const Emergency = mongoose_1.default.model("Emergency", emergencySchema);
exports.default = Emergency;
