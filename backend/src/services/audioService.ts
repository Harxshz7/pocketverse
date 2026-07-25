import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import { dbGet, dbRun } from '../db/schema';

const execAsync = promisify(exec);

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

export interface PacingNote {
  text_span: string;
  pause_ms: number;
  emphasis?: 'none' | 'moderate' | 'strong';
}

export interface PerformanceBrief {
  voice_id: string;
  voice_name?: string;
  voice_settings: VoiceSettings;
  pacing_notes: PacingNote[];
  ambience_description: string;
  ambience_volume_db: number;
}

export interface AudioRenderRecord {
  id: string;
  episode_id: string;
  performance_brief: PerformanceBrief;
  voice_id: string;
  audio_url: string;
  duration_seconds: number;
  status: 'generating' | 'ready' | 'failed';
  created_at: string;
}

const PUBLIC_AUDIO_DIR = path.join(__dirname, '../../public/audio');
if (!fs.existsSync(PUBLIC_AUDIO_DIR)) {
  fs.mkdirSync(PUBLIC_AUDIO_DIR, { recursive: true });
}

function getOpenAIClient(): OpenAI | null {
  const backendEnvPath = path.join(__dirname, '../../.env');
  const rootEnvPath = path.join(process.cwd(), '.env');
  const cwdBackendEnvPath = path.join(process.cwd(), 'backend/.env');

  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath, override: true });
  } else if (fs.existsSync(cwdBackendEnvPath)) {
    dotenv.config({ path: cwdBackendEnvPath, override: true });
  } else if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath, override: true });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey && apiKey !== 'your_openai_api_key_here' && apiKey.length > 20) {
    return new OpenAI({ apiKey });
  }
  return null;
}

export class AudioService {
  /**
   * PHASE 2: Generate Audio Performance Brief using 20+ Yr Technical Audio Director Persona
   */
  static async generatePerformanceBrief(episode: { id: string; title: string; content: string }, toneCategory: string): Promise<PerformanceBrief> {
    const openai = getOpenAIClient();
    const category = (toneCategory || 'Drama').toLowerCase();

    // Default Voice Archetype Presets per Tone Category
    let defaultVoiceId = '21m00Tcm4TlvDq8ikWAM'; // Rachel / Baritone
    let defaultVoiceName = 'Marcus Noir Baritone';
    let defaultAmbience = 'Rain slicked streets with distant thunder and city hum';
    let defaultVolumeDb = -18;
    let defaultSettings: VoiceSettings = { stability: 0.45, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true };

    if (category.includes('horror')) {
      defaultVoiceId = 'AZnzlk1XvdvUeBnXmlld'; // Domi / Shadow
      defaultVoiceName = 'Shadow Whispering Narrator';
      defaultAmbience = 'Eerie wind howling through old ruins with unsettling creaks';
      defaultVolumeDb = -22;
      defaultSettings = { stability: 0.35, similarity_boost: 0.90, style: 0.75, use_speaker_boost: true };
    } else if (category.includes('cyberpunk') || category.includes('sci-fi')) {
      defaultVoiceId = 'EXAVITQu4vr4xnSDxMaL'; // Bella / Synth
      defaultVoiceName = 'Neon Synth Modulated Narrator';
      defaultAmbience = 'Low frequency sub-bass hum with digital static and neon glare drones';
      defaultVolumeDb = -16;
      defaultSettings = { stability: 0.60, similarity_boost: 0.80, style: 0.40, use_speaker_boost: true };
    } else if (category.includes('funny') || category.includes('comedy')) {
      defaultVoiceId = 'pNInz6obpgDQGcFmaJgB'; // Adam / Dynamic
      defaultVoiceName = 'Dynamic Expressive Narrator';
      defaultAmbience = 'Light upbeat acoustic rhythm with subtle comedic room tones';
      defaultVolumeDb = -20;
      defaultSettings = { stability: 0.50, similarity_boost: 0.75, style: 0.65, use_speaker_boost: true };
    } else if (category.includes('noir')) {
      defaultVoiceId = '21m00Tcm4TlvDq8ikWAM';
      defaultVoiceName = 'Gravelly Trench-Coat Baritone';
      defaultAmbience = 'Midnight neon pavement rain with foghorns in the bay';
      defaultVolumeDb = -18;
      defaultSettings = { stability: 0.40, similarity_boost: 0.88, style: 0.60, use_speaker_boost: true };
    }

    // Default Pacing Notes based on text punctuation
    const sentences = episode.content.split(/(?<=[.!?])\s+/).filter(Boolean);
    const defaultPacingNotes: PacingNote[] = sentences.slice(0, 5).map((s, idx) => ({
      text_span: s.substring(0, 60),
      pause_ms: idx === sentences.length - 1 ? 1500 : 800,
      emphasis: idx % 2 === 0 ? 'strong' : 'moderate',
    }));

    if (openai) {
      console.log(`[AudioService] 🎧 Generating LLM Performance Brief for Episode: "${episode.title}" (${toneCategory} tone)...`);
      try {
        const prompt = `
You are a Principal Audio Engineer and Technical Audio Director with 20+ years of experience producing award-winning audio dramas.

YOUR TASK:
Analyze the submitted episode script ("${episode.title}") in genre tone "${toneCategory}".
Create a detailed, structured audio performance brief for an automated audio production engine.

SUBMITTED SCRIPT:
"""
${episode.content}
"""

Requirements:
1. Select a voice archetype matching "${toneCategory}" (e.g., gravelly baritone for Noir, whispering shadow for Horror, synth-modulated for Sci-Fi, dynamic for Comedy).
2. Define voice parameters: stability (0.1 - 1.0), similarity_boost (0.1 - 1.0), style (0.0 - 1.0), use_speaker_boost (boolean).
3. Mark key text spans for dramatic pacing pauses (pause_ms between 400ms and 2000ms) and audio emphasis.
4. Describe a rich background ambience sound effect bed and set ambience_volume_db (how far background sits under narration, e.g. -12dB to -24dB).

Return ONLY a valid JSON object:
{
  "voice_id": "${defaultVoiceId}",
  "voice_name": "${defaultVoiceName}",
  "voice_settings": {
    "stability": 0.45,
    "similarity_boost": 0.85,
    "style": 0.60,
    "use_speaker_boost": true
  },
  "pacing_notes": [
    {
      "text_span": "First key sentence or clause",
      "pause_ms": 1000,
      "emphasis": "strong" | "moderate" | "none"
    }
  ],
  "ambience_description": "Detailed background sound bed description",
  "ambience_volume_db": -18
}
`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a veteran technical audio director for audio dramas. Respond strictly in JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.4,
        });

        const parsed = JSON.parse(response.choices[0].message.content || '{}');
        return {
          voice_id: parsed.voice_id || defaultVoiceId,
          voice_name: parsed.voice_name || defaultVoiceName,
          voice_settings: {
            stability: typeof parsed.voice_settings?.stability === 'number' ? parsed.voice_settings.stability : defaultSettings.stability,
            similarity_boost: typeof parsed.voice_settings?.similarity_boost === 'number' ? parsed.voice_settings.similarity_boost : defaultSettings.similarity_boost,
            style: typeof parsed.voice_settings?.style === 'number' ? parsed.voice_settings.style : defaultSettings.style,
            use_speaker_boost: typeof parsed.voice_settings?.use_speaker_boost === 'boolean' ? parsed.voice_settings.use_speaker_boost : defaultSettings.use_speaker_boost,
          },
          pacing_notes: Array.isArray(parsed.pacing_notes) && parsed.pacing_notes.length > 0 ? parsed.pacing_notes : defaultPacingNotes,
          ambience_description: parsed.ambience_description || defaultAmbience,
          ambience_volume_db: typeof parsed.ambience_volume_db === 'number' ? parsed.ambience_volume_db : defaultVolumeDb,
        };
      } catch (err: any) {
        console.error('[AudioService] LLM Performance Brief Error:', err?.message || err);
      }
    }

    return {
      voice_id: defaultVoiceId,
      voice_name: defaultVoiceName,
      voice_settings: defaultSettings,
      pacing_notes: defaultPacingNotes,
      ambience_description: defaultAmbience,
      ambience_volume_db: defaultVolumeDb,
    };
  }

  /**
   * PHASE 1 - 4: Render Audio (TTS + SFX + ffmpeg Ducking Mix)
   */
  static async renderAudio(episodeId: string, brief: PerformanceBrief): Promise<AudioRenderRecord> {
    const renderId = uuidv4();

    // 1. Fetch Episode text
    const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    // Set episode audio_status to 'generating'
    await dbRun('UPDATE episodes SET audio_status = "generating", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [episodeId]);

    // Initial AudioRender DB row
    await dbRun(`
      INSERT INTO audio_renders (id, episode_id, performance_brief, voice_id, audio_url, duration_seconds, status)
      VALUES (?, ?, ?, ?, ?, ?, 'generating')
    `, [renderId, episodeId, JSON.stringify(brief), brief.voice_id, '', 0]);

    const filename = `render-${renderId}.mp3`;
    const outputPath = path.join(PUBLIC_AUDIO_DIR, filename);
    const audioUrl = `/audio/${filename}`;

    try {
      const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
      let narrationPath = path.join(PUBLIC_AUDIO_DIR, `narration-${renderId}.mp3`);
      let ambiencePath = path.join(PUBLIC_AUDIO_DIR, `ambience-${renderId}.mp3`);

      if (apiKey && apiKey.length > 10) {
        console.log(`[AudioService] 🎙️ Calling ElevenLabs API for Voice ${brief.voice_id}...`);
        await AudioService.callElevenLabsTTS(episode.content, brief, narrationPath, apiKey);
        if (brief.ambience_description) {
          console.log(`[AudioService] 🔊 Calling ElevenLabs SFX API for Ambience: "${brief.ambience_description}"...`);
          await AudioService.callElevenLabsSFX(brief.ambience_description, ambiencePath, apiKey);
        }
      } else {
        console.log('[AudioService] ⚠️ ELEVENLABS_API_KEY missing or empty. Generating audio via server-side sound synthesis engine...');
        await AudioService.generateSyntheticNarration(episode.content, brief, narrationPath);
        if (brief.ambience_description) {
          await AudioService.generateSyntheticAmbience(brief.ambience_description, ambiencePath);
        }
      }

      // PHASE 4: Server-Side ffmpeg Ducking Mix
      let finalDuration = 15;
      if (fs.existsSync(narrationPath) && fs.existsSync(ambiencePath)) {
        console.log(`[AudioService] 🎛️ Executing ffmpeg Ducking Mix at ${brief.ambience_volume_db}dB...`);
        try {
          const volumeGain = Math.pow(10, (brief.ambience_volume_db || -18) / 20).toFixed(3);
          const ffmpegCmd = `ffmpeg -y -i "${narrationPath}" -i "${ambiencePath}" -filter_complex "[1:a]volume=${volumeGain},loop=loop=-1:size=2000000[bg];[bg][0:a]amix=inputs=2:duration=first[out]" -map "[out]" "${outputPath}"`;
          await execAsync(ffmpegCmd);
        } catch (ffmpegErr: any) {
          console.warn('[AudioService] ffmpeg command fallback, copying narration audio file directly:', ffmpegErr?.message);
          fs.copyFileSync(narrationPath, outputPath);
        }
      } else if (fs.existsSync(narrationPath)) {
        fs.copyFileSync(narrationPath, outputPath);
      } else {
        await AudioService.generateSyntheticNarration(episode.content, brief, outputPath);
      }

      // Calculate audio duration
      try {
        const stat = fs.statSync(outputPath);
        finalDuration = Math.max(5, Math.round(stat.size / 16000));
      } catch (e) {
        finalDuration = 12;
      }

      // Clean up temp files
      if (fs.existsSync(narrationPath)) fs.unlinkSync(narrationPath);
      if (fs.existsSync(ambiencePath)) fs.unlinkSync(ambiencePath);

      // Update AudioRender record
      await dbRun(`
        UPDATE audio_renders 
        SET audio_url = ?, duration_seconds = ?, status = 'ready'
        WHERE id = ?
      `, [audioUrl, finalDuration, renderId]);

      // CRITICAL REQUIREMENT: Update episode audio_status to 'ready_to_review' (NEVER 'published')
      await dbRun(`
        UPDATE episodes 
        SET audio_status = 'ready_to_review', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [episodeId]);

      console.log(`[AudioService] ✅ Audio Render Completed Successfully! File: ${audioUrl} (Duration: ${finalDuration}s). Episode Status: ready_to_review.`);

      return {
        id: renderId,
        episode_id: episodeId,
        performance_brief: brief,
        voice_id: brief.voice_id,
        audio_url: audioUrl,
        duration_seconds: finalDuration,
        status: 'ready',
        created_at: new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[AudioService] Audio Generation Failed:', err?.message || err);
      await dbRun('UPDATE audio_renders SET status = "failed" WHERE id = ?', [renderId]);
      await dbRun('UPDATE episodes SET audio_status = "none" WHERE id = ?', [episodeId]);
      throw err;
    }
  }

  /**
   * PHASE 1: Explicit Publish Action (Separate from Generate)
   */
  static async publishAudio(episodeId: string): Promise<any> {
    const episode = await dbGet<any>('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    if (episode.audio_status !== 'ready_to_review' && episode.audio_status !== 'published') {
      throw new Error('Episode audio must be in ready_to_review state before publishing.');
    }

    const now = new Date().toISOString();
    await dbRun(`
      UPDATE episodes 
      SET audio_status = 'published', published_at = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [now, episodeId]);

    console.log(`[AudioService] 🚀 EXPLICIT PUBLISH ACTION: Episode "${episode.title}" (${episodeId}) Audio Status updated to PUBLISHED at ${now}.`);

    return {
      episode_id: episodeId,
      audio_status: 'published',
      published_at: now,
    };
  }

  /**
   * Fetch Audio Render & Status
   */
  static async getAudioRender(episodeId: string): Promise<any> {
    const episode = await dbGet<any>('SELECT id, title, audio_status, published_at FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) {
      throw new Error(`Episode not found: ${episodeId}`);
    }

    const render = await dbGet<any>('SELECT * FROM audio_renders WHERE episode_id = ? AND status = "ready" ORDER BY created_at DESC LIMIT 1', [episodeId]);

    let parsedBrief = null;
    if (render && render.performance_brief) {
      try {
        parsedBrief = JSON.parse(render.performance_brief);
      } catch (e) {
        parsedBrief = null;
      }
    }

    return {
      episode_id: episodeId,
      audio_status: episode.audio_status || 'none',
      published_at: episode.published_at || null,
      latest_render: render ? {
        id: render.id,
        voice_id: render.voice_id,
        audio_url: render.audio_url,
        duration_seconds: render.duration_seconds,
        status: render.status,
        created_at: render.created_at,
        performance_brief: parsedBrief,
      } : null,
    };
  }

  // --- ElevenLabs API Helpers ---

  private static async callElevenLabsTTS(text: string, brief: PerformanceBrief, outputPath: string, apiKey: string): Promise<void> {
    const voiceId = brief.voice_id || '21m00Tcm4TlvDq8ikWAM';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: brief.voice_settings,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs TTS Error (${response.status}): ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
  }

  private static async callElevenLabsSFX(prompt: string, outputPath: string, apiKey: string): Promise<void> {
    const url = 'https://api.elevenlabs.io/v1/sound-generation';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 15,
        prompt_influence: 0.5,
      }),
    });

    if (!response.ok) {
      console.warn(`ElevenLabs SFX Warning (${response.status}): Could not fetch SFX, using synthetic bed.`);
      await AudioService.generateSyntheticAmbience(prompt, outputPath);
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(outputPath, buffer);
  }

  // --- Synthetic Audio Generator (Fallback) ---

  private static async generateSyntheticNarration(text: string, brief: PerformanceBrief, outputPath: string): Promise<void> {
    const sampleRate = 22050;
    const duration = Math.min(30, Math.max(8, Math.round(text.length / 15)));
    const numSamples = sampleRate * duration;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(1, 22); // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    // Tone modulation simulating vocal audio speech rhythm
    let baseFreq = 160;
    if (brief.voice_name?.toLowerCase().includes('baritone')) baseFreq = 110;
    if (brief.voice_name?.toLowerCase().includes('synth')) baseFreq = 220;

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Speech syllable modulation envelope
      const speechEnv = Math.sin(2 * Math.PI * 4 * t) > 0 ? 0.8 : 0.2;
      const sample = Math.sin(2 * Math.PI * baseFreq * t) * 0.3 * speechEnv;
      buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
    }

    fs.writeFileSync(outputPath, buffer);
  }

  private static async generateSyntheticAmbience(prompt: string, outputPath: string): Promise<void> {
    const sampleRate = 22050;
    const duration = 15;
    const numSamples = sampleRate * duration;
    const buffer = Buffer.alloc(44 + numSamples * 2);

    // WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + numSamples * 2, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(1, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(numSamples * 2, 40);

    for (let i = 0; i < numSamples; i++) {
      // Atmospheric ambient noise
      const noise = (Math.random() * 2 - 1) * 0.05;
      buffer.writeInt16LE(Math.floor(noise * 32767), 44 + i * 2);
    }

    fs.writeFileSync(outputPath, buffer);
  }
}
