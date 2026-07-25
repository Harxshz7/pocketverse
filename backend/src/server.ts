import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './db/schema';
import { createSeries, getAllSeries, getSeriesById } from './controllers/seriesController';
import { createEpisode, deleteEpisode, getEpisodeById, updateEpisode } from './controllers/episodeController';
import { runContinuity, runGrammar, runToneRemix, saveAnalysis } from './controllers/analysisController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes matching exact spec
// Series CRUD
app.post('/api/series', createSeries);
app.get('/api/series', getAllSeries);
app.get('/api/series/:id', getSeriesById);

// Episode CRUD
app.post('/api/series/:id/episodes', createEpisode);
app.get('/api/episodes/:id', getEpisodeById);
app.put('/api/episodes/:id', updateEpisode);
app.delete('/api/episodes/:id', deleteEpisode);

// Guided Step-by-Step AI Analysis Wizard endpoints
app.post('/api/episodes/:id/analysis/continuity', runContinuity);
app.post('/api/episodes/:id/analysis/grammar', runGrammar);
app.post('/api/episodes/:id/analysis/tone', runToneRemix);
app.post('/api/episodes/:id/analysis/save', saveAnalysis);

// Initialize DB and start server
initDb().then(() => {
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`⚡ PocketVerse Backend Server running on http://127.0.0.1:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
});
