export interface ProgressState {
  jobId: string;
  stage: string;
  percent: number;
  status: 'in_progress' | 'completed' | 'failed';
  logs: string[];
  subStep?: string;
  timestamp: number;
}

class ProgressService {
  private progressMap: Map<string, ProgressState> = new Map();

  public updateProgress(jobId: string, percent: number, stage: string, logMessage?: string, subStep?: string) {
    let state = this.progressMap.get(jobId);
    const now = Date.now();

    if (!state) {
      state = {
        jobId,
        stage,
        percent,
        status: percent >= 100 ? 'completed' : 'in_progress',
        logs: [],
        subStep,
        timestamp: now,
      };
    } else {
      state.stage = stage;
      state.percent = Math.min(100, Math.max(state.percent, percent));
      state.status = percent >= 100 ? 'completed' : 'in_progress';
      state.timestamp = now;
      if (subStep) state.subStep = subStep;
    }

    if (logMessage) {
      const timeStr = new Date().toLocaleTimeString();
      const formattedLog = `[${timeStr}] ${logMessage}`;
      // Prevent exact duplicate consecutive logs
      if (state.logs.length === 0 || state.logs[state.logs.length - 1] !== formattedLog) {
        state.logs.push(formattedLog);
        if (state.logs.length > 20) {
          state.logs.shift(); // Keep last 20 clean logs
        }
      }
    }

    this.progressMap.set(jobId, state);
  }

  public getProgress(jobId: string): ProgressState {
    const existing = this.progressMap.get(jobId);
    if (existing) {
      return existing;
    }
    return {
      jobId,
      stage: '⚡ Initializing AI Production Engine...',
      percent: 15,
      status: 'in_progress',
      logs: [`[${new Date().toLocaleTimeString()}] Agentic session initialized`],
      subStep: 'GPT-4o Engine',
      timestamp: Date.now(),
    };
  }

  public completeProgress(jobId: string, finalLog?: string) {
    this.updateProgress(jobId, 100, '✨ Preparing Final Version & Master Track...', finalLog || '✅ Version ready', 'Complete');
    const state = this.progressMap.get(jobId);
    if (state) {
      state.status = 'completed';
    }
  }

  public failProgress(jobId: string, errorMsg: string) {
    this.updateProgress(jobId, 100, 'Process Encountered an Error', `❌ Error: ${errorMsg}`, 'Failed');
    const state = this.progressMap.get(jobId);
    if (state) {
      state.status = 'failed';
    }
  }

  public resetProgress(jobId: string) {
    this.progressMap.delete(jobId);
  }
}

export const progressService = new ProgressService();
