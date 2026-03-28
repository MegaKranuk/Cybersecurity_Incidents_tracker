import express from "express";
import cors from "cors";
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger.json';
import incidentsRoutes from "./routes/incidents.routes";
import { loggingMiddleware } from "./middleware/logging.middleware";
import { errorHandler } from "./middleware/error-handler.middleware";
import { migrate } from "./db/migrate";

const app = express();

app.use(cors()); 

app.use(express.json());
app.use(loggingMiddleware);

app.use("/api/incidents", incidentsRoutes);
app.use(errorHandler);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

async function bootstrap() {
  await migrate();
  
  app.listen(3000, () => {
    console.log("API started on http://localhost:3000");
  });
}

bootstrap().catch(console.error);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));