"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const users_1 = __importDefault(require("./routes/users"));
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const my_hotels_1 = __importDefault(require("./routes/my-hotels"));
const hotels_1 = __importDefault(require("./routes/hotels"));
const my_bookings_1 = __importDefault(require("./routes/my-bookings"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// })
// mongoose.connect(process.env.MONGODB_CONNECTION_STRING as string);
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: [process.env.FRONTEND_URL ? process.env.FRONTEND_URL : ""],
    credentials: true,
}));
app.get("/api/test", (req, res) => {
    res.json({ message: "hello from express endpoint!" });
});
app.use("/api/auth", auth_1.default);
app.use("/api/users", users_1.default);
app.use("/api/my-hotels", my_hotels_1.default);
app.use("/api/hotels", hotels_1.default);
app.use("/dashboard", dashboard_1.default);
app.use("/api/my-bookings", my_bookings_1.default);
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
const specs = (0, swagger_jsdoc_1.default)(options);
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../../frontend/dist/index.html"));
});
app.listen(7000, () => {
    console.log("server running on localhost:7000");
});
