import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import incidentsRoutes from "./routes/incidents.routes";
import authRoutes from "./routes/auth.routes";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";
import { securityHeaders } from "./middleware/security-headers.middleware";
import { jwtAuth } from "./middleware/jwt-auth.middleware";
import { migrate } from "./db/migrate";

const app = express();

const allowedOrigins = ["http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("CORS not allowed"));
  },
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(securityHeaders);
app.use(express.json());
app.use(loggingMiddleware);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/incidents", jwtAuth, incidentsRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(errorHandler);

async function bootstrap() {
  await migrate();
  app.listen(3000, () => console.log("Server: http://localhost:3000"));
}

bootstrap().catch(console.error);