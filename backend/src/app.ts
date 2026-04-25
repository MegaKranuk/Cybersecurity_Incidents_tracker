import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "./swagger.json";
import incidentsRoutes from "./routes/incidents.routes";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";
import { migrate } from "./db/migrate";

const app = express();

const allowedOrigins = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' is not allowed`), false);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(loggingMiddleware);

app.use("/api/v1/incidents", incidentsRoutes);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

async function bootstrap() {
  await migrate();
  app.listen(3000, () => {
    console.log("API started on http://localhost:3000");
    console.log("Swagger:        http://localhost:3000/api-docs");
  });
}

bootstrap().catch(console.error);
