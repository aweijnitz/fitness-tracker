import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerMealRoutes } from './routes/meals.js';
import { registerActivityRoutes } from './routes/activities.js';
import { registerWorkoutRoutes } from './routes/workouts.js';
import { registerWeightRoutes } from './routes/weights.js';
import { registerDevRoutes } from './routes/dev.js';
import { getDatabase, initSchema } from './dbSetup.js';

// .env is now loaded via dotenv/config side-effect import above


export function createServer(dbPath = process.env.DB_PATH || 'fitness.db') {
  const db = getDatabase(dbPath);
  initSchema(db);

  const app = express();
  app.use(express.json());

  // Register routes
  registerMealRoutes(app, db);
  registerActivityRoutes(app, db);
  registerWorkoutRoutes(app, db);
  registerWeightRoutes(app, db);
  registerDevRoutes(app, db);

  // static client serving
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/v1/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });

  return { app, db };
}

// start server if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { app } = createServer();
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || process.env.IP || '0.0.0.0';
  app.listen(port, host, () => console.log(`Server listening on http://${host}:${port}`));
}
