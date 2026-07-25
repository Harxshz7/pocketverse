import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbAll, dbGet, dbRun } from '../db/schema';

export async function createEpisode(req: Request, res: Response) {
  try {
    const seriesId = req.params.seriesId || req.params.id;
    const { title, content } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Episode title is required.' });
    }

    const series = await dbGet('SELECT * FROM series WHERE id = ?', [seriesId]);
    if (!series) {
      return res.status(404).json({ error: 'Parent series not found.' });
    }

    // Auto-calculate episode number based on existing count
    const maxEp = await dbGet<{ max_num: number | null }>(
      'SELECT MAX(episode_number) as max_num FROM episodes WHERE series_id = ?',
      [seriesId]
    );
    const episodeNumber = (maxEp && maxEp.max_num !== null) ? maxEp.max_num + 1 : 1;

    const episodeId = uuidv4();
    const episodeContent = typeof content === 'string' ? content : '';

    await dbRun(
      `INSERT INTO episodes (id, series_id, episode_number, title, content, status)
       VALUES (?, ?, ?, ?, ?, 'draft')`,
      [episodeId, seriesId, episodeNumber, title.trim(), episodeContent]
    );

    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    return res.status(201).json(episode);
  } catch (err: any) {
    console.error('Error in createEpisode:', err);
    return res.status(500).json({ error: 'Failed to create episode' });
  }
}

export async function getEpisodeById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [id]);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const series = await dbGet('SELECT * FROM series WHERE id = ?', [episode.series_id]);

    // Fetch latest analysis run if exists
    const analysisRunRaw = await dbGet(
      'SELECT * FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1',
      [id]
    );

    let analysisRun = null;
    if (analysisRunRaw) {
      analysisRun = {
        ...analysisRunRaw,
        continuity_result: analysisRunRaw.continuity_result ? JSON.parse(analysisRunRaw.continuity_result) : null,
        grammar_result: analysisRunRaw.grammar_result ? JSON.parse(analysisRunRaw.grammar_result) : null,
        tone_remix_result: analysisRunRaw.tone_remix_result ? JSON.parse(analysisRunRaw.tone_remix_result) : null,
      };
    }

    return res.json({
      episode,
      series_title: series ? series.title : 'Unknown Series',
      latest_analysis: analysisRun,
    });
  } catch (err: any) {
    console.error('Error in getEpisodeById:', err);
    return res.status(500).json({ error: 'Failed to fetch episode details' });
  }
}

export async function updateEpisode(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const existing = await dbGet('SELECT * FROM episodes WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const updatedTitle = typeof title === 'string' ? title.trim() : existing.title;
    const updatedContent = typeof content === 'string' ? content : existing.content;

    await dbRun(
      `UPDATE episodes 
       SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [updatedTitle, updatedContent, id]
    );

    const updated = await dbGet('SELECT * FROM episodes WHERE id = ?', [id]);
    return res.json(updated);
  } catch (err: any) {
    console.error('Error in updateEpisode:', err);
    return res.status(500).json({ error: 'Failed to update episode' });
  }
}

export async function deleteEpisode(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM episodes WHERE id = ?', [id]);
    return res.json({ message: 'Episode deleted successfully' });
  } catch (err: any) {
    console.error('Error in deleteEpisode:', err);
    return res.status(500).json({ error: 'Failed to delete episode' });
  }
}
