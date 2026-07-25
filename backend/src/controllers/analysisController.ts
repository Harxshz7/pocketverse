import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { dbGet, dbRun } from '../db/schema';
import { AIService } from '../services/aiService';

/**
 * STEP 1: Continuity & Story-Hole Check
 */
export async function runContinuity(req: Request, res: Response) {
  try {
    const { id: episodeId } = req.params;

    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Find previous episode in the series (episode_number - 1)
    const previousEpisode = await dbGet(
      'SELECT * FROM episodes WHERE series_id = ? AND episode_number = ? LIMIT 1',
      [episode.series_id, episode.episode_number - 1]
    );

    // Run AI Continuity & Hook Analysis
    const continuityResult = await AIService.runContinuityAnalysis({
      currentEpisode: episode,
      previousEpisode: previousEpisode || null,
    });

    // Check if an existing AnalysisRun exists or create a new one
    const existingRun = await dbGet(
      'SELECT * FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1',
      [episodeId]
    );

    let runId = uuidv4();
    if (existingRun) {
      runId = existingRun.id;
      await dbRun(
        `UPDATE analysis_runs 
         SET continuity_result = ?, status = 'continuity_done', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(continuityResult), runId]
      );
    } else {
      await dbRun(
        `INSERT INTO analysis_runs (id, episode_id, continuity_result, status)
         VALUES (?, ?, ?, 'continuity_done')`,
        [runId, episodeId, JSON.stringify(continuityResult)]
      );
    }

    // Update episode status to 'analyzed'
    await dbRun("UPDATE episodes SET status = 'analyzed' WHERE id = ?", [episodeId]);

    return res.json({
      analysis_run_id: runId,
      continuity_result: continuityResult,
    });
  } catch (err: any) {
    console.error('Error in runContinuity:', err);
    return res.status(500).json({ error: 'Failed to run continuity analysis' });
  }
}

/**
 * STEP 2: Grammar Layer
 */
export async function runGrammar(req: Request, res: Response) {
  try {
    const { id: episodeId } = req.params;
    const { current_content } = req.body;

    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const targetContent = typeof current_content === 'string' ? current_content : episode.content;

    // Run AI Grammar Analysis
    const grammarIssues = await AIService.runGrammarAnalysis({
      content: targetContent,
    });

    // Find active analysis run
    const existingRun = await dbGet(
      'SELECT * FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1',
      [episodeId]
    );

    const runId = existingRun ? existingRun.id : uuidv4();

    if (existingRun) {
      await dbRun(
        `UPDATE analysis_runs 
         SET grammar_result = ?, status = 'grammar_done', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(grammarIssues), runId]
      );
    } else {
      await dbRun(
        `INSERT INTO analysis_runs (id, episode_id, grammar_result, status)
         VALUES (?, ?, ?, 'grammar_done')`,
        [runId, episodeId, JSON.stringify(grammarIssues)]
      );
    }

    return res.json({
      analysis_run_id: runId,
      grammar_result: grammarIssues,
    });
  } catch (err: any) {
    console.error('Error in runGrammar:', err);
    return res.status(500).json({ error: 'Failed to run grammar analysis' });
  }
}

/**
 * STEP 3: Tone / Genre Remix
 */
export async function runToneRemix(req: Request, res: Response) {
  try {
    const { id: episodeId } = req.params;
    const { category, current_content } = req.body;

    if (!category || typeof category !== 'string') {
      return res.status(400).json({ error: 'Genre category is required.' });
    }

    const episode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    const previousEpisode = await dbGet(
      'SELECT * FROM episodes WHERE series_id = ? AND episode_number = ? LIMIT 1',
      [episode.series_id, episode.episode_number - 1]
    );

    const targetContent = typeof current_content === 'string' ? current_content : episode.content;

    const toneResult = await AIService.runToneRemix({
      category,
      currentEpisode: {
        title: episode.title,
        content: targetContent,
      },
      previousEpisode: previousEpisode || null,
    });

    const existingRun = await dbGet(
      'SELECT * FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1',
      [episodeId]
    );

    const runId = existingRun ? existingRun.id : uuidv4();

    if (existingRun) {
      await dbRun(
        `UPDATE analysis_runs 
         SET tone_remix_result = ?, status = 'tone_step', updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [JSON.stringify(toneResult), runId]
      );
    } else {
      await dbRun(
        `INSERT INTO analysis_runs (id, episode_id, tone_remix_result, status)
         VALUES (?, ?, ?, 'tone_step')`,
        [runId, episodeId, JSON.stringify(toneResult)]
      );
    }

    return res.json({
      analysis_run_id: runId,
      tone_remix_result: toneResult,
    });
  } catch (err: any) {
    console.error('Error in runToneRemix:', err);
    return res.status(500).json({ error: 'Failed to run tone remix' });
  }
}

/**
 * STEP 4: Save / Finalize Episode
 */
export async function saveAnalysis(req: Request, res: Response) {
  try {
    const { id: episodeId } = req.params;
    const { final_content } = req.body;

    if (typeof final_content !== 'string') {
      return res.status(400).json({ error: 'Final content text string is required.' });
    }

    // Update episode content and status to 'finalized'
    await dbRun(
      `UPDATE episodes 
       SET content = ?, status = 'finalized', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [final_content, episodeId]
    );

    // Update analysis run status to 'complete'
    await dbRun(
      `UPDATE analysis_runs 
       SET status = 'complete', updated_at = CURRENT_TIMESTAMP 
       WHERE episode_id = ?`,
      [episodeId]
    );

    const updatedEpisode = await dbGet('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    return res.json({
      message: 'Episode successfully finalized and saved.',
      episode: updatedEpisode,
    });
  } catch (err: any) {
    console.error('Error in saveAnalysis:', err);
    return res.status(500).json({ error: 'Failed to save final episode content' });
  }
}
