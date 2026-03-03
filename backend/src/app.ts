import express from "express";
import cors from "cors";
import incidentsRoutes from "./routes/incidents.routes";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";

const app = express();

app.use(cors()); 

app.use(express.json());
app.use(loggingMiddleware);

app.use("/api/incidents", incidentsRoutes);

app.use(errorHandler);

app.listen(3000, () => {
  console.log("API started on http://localhost:3000");
});