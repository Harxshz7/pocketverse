import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '../db/schema';

export async function createSeries(req: Request, res: Response) {
  try {
    const { title } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Series title is required.' });
    }

    const id = uuidv4();
    const creatorId = 'creator-default'; // Single unified creator permission model

    await dbRun(
      'INSERT INTO series (id, title, creator_id) VALUES (?, ?, ?)',
      [id, title.trim(), creatorId]
    );

    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    return res.status(201).json(series);
  } catch (err: any) {
    console.error('Error in createSeries:', err);
    return res.status(500).json({ error: 'Failed to create series' });
  }
}

export async function getAllSeries(req: Request, res: Response) {
  try {
    const seriesList = await dbAll('SELECT * FROM series ORDER BY created_at DESC');
    
    // Attach episode count for each series
    for (const s of seriesList) {
      const countRes = await dbGet<{ count: number }>(
        'SELECT COUNT(*) as count FROM episodes WHERE series_id = ?',
        [s.id]
      );
      s.episode_count = countRes ? countRes.count : 0;
    }

    return res.json(seriesList);
  } catch (err: any) {
    console.error('Error in getAllSeries:', err);
    return res.status(500).json({ error: 'Failed to fetch series list' });
  }
}

export async function getSeriesById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const series = await dbGet('SELECT * FROM series WHERE id = ?', [id]);
    if (!series) {
      return res.status(404).json({ error: 'Series not found' });
    }

    const episodes = await dbAll(
      'SELECT * FROM episodes WHERE series_id = ? ORDER BY episode_number ASC',
      [id]
    );

    return res.json({
      ...series,
      episodes,
    });
  } catch (err: any) {
    console.error('Error in getSeriesById:', err);
    return res.status(500).json({ error: 'Failed to fetch series' });
  }
}
