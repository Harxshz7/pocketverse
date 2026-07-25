import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initDb } from './db/schema';

// Import Controllers
import { SeriesController } from './controllers/seriesController';
import { EpisodeController } from './controllers/episodeController';
import { AnalysisController } from './controllers/analysisController';
import { AudioController } from './controllers/audioController';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve generated audio static files from public/audio
const publicAudioDir = path.join(__dirname, '../public/audio');
app.use('/audio', express.static(publicAudioDir));

// --- API ROUTES ---

// 1. Series Routes
app.get('/api/series', SeriesController.getAllSeries);
app.post('/api/series', SeriesController.createSeries);
app.get('/api/series/:id', SeriesController.getSeriesById);

// 2. Episode Routes
app.post('/api/series/:seriesId/episodes', EpisodeController.createEpisode);
app.get('/api/episodes/:id', EpisodeController.getEpisodeById);
app.put('/api/episodes/:id', EpisodeController.updateEpisode);
app.delete('/api/episodes/:id', EpisodeController.deleteEpisode);

// 3. Analysis Pipeline Routes
app.post('/api/episodes/:id/analysis/continuity', AnalysisController.runContinuity);
app.post('/api/episodes/:id/analysis/grammar', AnalysisController.runGrammar);
app.post('/api/episodes/:id/analysis/tone', AnalysisController.runTone);
app.post('/api/episodes/:id/analysis/save', AnalysisController.saveAndPublish);

// 4. Audio Production Pipeline Routes
app.post('/api/episodes/:id/audio/direction', AudioController.getDirection);
app.post('/api/episodes/:id/audio/generate', AudioController.generate);
app.get('/api/episodes/:id/audio', AudioController.getAudioStatus);
app.post('/api/episodes/:id/audio/publish', AudioController.publish);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize DB and start server
initDb()
  .then(() => {
    app.listen(PORT, '0.0.0.0' as any, () => {
      console.log(`⚡ PocketVerse Backend Server running on http://127.0.0.1:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
  });
