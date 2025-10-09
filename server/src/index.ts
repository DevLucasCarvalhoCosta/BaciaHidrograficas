import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { router as anaRouter } from './routes/ana';

const app = express();

app.use(cors());
app.use(express.json());

// Minimal startup config log (without exposing secrets)
if (process.env.ANA_BASE_URL) {
  console.log('[Config] ANA_BASE_URL is set');
} else {
  console.warn('[Config] ANA_BASE_URL is NOT set');
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/ana', anaRouter);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
