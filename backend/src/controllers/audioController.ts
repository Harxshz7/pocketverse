import { Request, Response } from 'express';
import { dbGet } from '../db/schema';
import { AudioService, PerformanceBrief } from '../services/audioService';

export class AudioController {
  /**
   * POST /api/episodes/:id/audio/direction
   * Generates the Performance Brief (LLM Call, Step 3 of Workflow)
   */
  static async getDirection(req: Request, res: Response) {
    try {
      const episodeId = req.params.id;
      const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      // Fetch latest tone remix category if present in analysis_runs
      const analysisRun = await dbGet<any>('SELECT tone_remix_result FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1', [episodeId]);
      let toneCategory = 'Drama';
      if (analysisRun && analysisRun.tone_remix_result) {
        try {
          const parsed = JSON.parse(analysisRun.tone_remix_result);
          if (parsed.category) toneCategory = parsed.category;
        } catch (e) {}
      }

      const performanceBrief = await AudioService.generatePerformanceBrief(episode, toneCategory);
      return res.json({
        episode_id: episodeId,
        tone_category: toneCategory,
        performance_brief: performanceBrief,
      });
    } catch (err: any) {
      console.error('AudioController.getDirection Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate performance brief' });
    }
  }

  /**
   * POST /api/episodes/:id/audio/generate
   * Body: { performance_brief?: PerformanceBrief }
   * Runs TTS + sound effects + mix. Sets audio_status to ready_to_review. (NEVER auto-publishes)
   */
  static async generate(req: Request, res: Response) {
    try {
      const episodeId = req.params.id;
      const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
      if (!episode) {
        return res.status(404).json({ error: 'Episode not found' });
      }

      let brief: PerformanceBrief = req.body?.performance_brief;
      if (!brief || !brief.voice_id) {
        // Fetch tone category
        const analysisRun = await dbGet<any>('SELECT tone_remix_result FROM analysis_runs WHERE episode_id = ? ORDER BY created_at DESC LIMIT 1', [episodeId]);
        let toneCategory = 'Drama';
        if (analysisRun && analysisRun.tone_remix_result) {
          try {
            const parsed = JSON.parse(analysisRun.tone_remix_result);
            if (parsed.category) toneCategory = parsed.category;
          } catch (e) {}
        }
        brief = await AudioService.generatePerformanceBrief(episode, toneCategory);
      }

      const render = await AudioService.renderAudio(episodeId, brief);
      return res.json({
        message: 'Audio render generated successfully',
        audio_status: 'ready_to_review',
        render,
      });
    } catch (err: any) {
      console.error('AudioController.generate Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate audio render' });
    }
  }

  /**
   * GET /api/episodes/:id/audio
   * Fetch current AudioRender + audio_status + published_at
   */
  static async getAudioStatus(req: Request, res: Response) {
    try {
      const episodeId = req.params.id;
      const audioStatusData = await AudioService.getAudioRender(episodeId);
      return res.json(audioStatusData);
    } catch (err: any) {
      console.error('AudioController.getAudioStatus Error:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch audio status' });
    }
  }

  /**
   * POST /api/episodes/:id/audio/publish
   * Explicit Publish Action — separate from generate. Updates audio_status to 'published'
   */
  static async publish(req: Request, res: Response) {
    try {
      const episodeId = req.params.id;
      const result = await AudioService.publishAudio(episodeId);
      return res.json({
        message: 'Audio episode published successfully',
        ...result,
      });
    } catch (err: any) {
      console.error('AudioController.publish Error:', err);
      return res.status(400).json({ error: err.message || 'Failed to publish audio episode' });
    }
  }
}
