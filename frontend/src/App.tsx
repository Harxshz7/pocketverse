import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SeriesModal } from './components/SeriesModal';
import { EpisodeList } from './components/EpisodeList';
import { EpisodeEditor } from './components/EpisodeEditor';
import { FinishedEpisodeView } from './components/FinishedEpisodeView';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { AudioStudioModal } from './components/AudioStudioModal';
import { Series, Episode, AnalysisRun } from './types';
import { api } from './api/client';
import { RotateCw, PlusCircle } from 'lucide-react';

export function App() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<Series | null>(null);

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisRun | null>(null);

  // View States
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [wizardStartStep, setWizardStartStep] = useState<number>(1);
  const [isAudioStudioOpen, setIsAudioStudioOpen] = useState<boolean>(false);
  const [audioTargetEpisode, setAudioTargetEpisode] = useState<Episode | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSeriesList();
  }, []);

  useEffect(() => {
    if (selectedSeriesId) {
      loadSeriesDetails(selectedSeriesId);
    }
  }, [selectedSeriesId]);

  useEffect(() => {
    if (selectedEpisodeId) {
      loadEpisodeDetails(selectedEpisodeId);
    } else {
      setCurrentEpisode(null);
      setLatestAnalysis(null);
    }
  }, [selectedEpisodeId]);

  const loadSeriesList = async () => {
    setLoading(true);
    try {
      const list = await api.getAllSeries();
      setSeriesList(list);
      if (list.length > 0 && !selectedSeriesId) {
        setSelectedSeriesId(list[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load series:', err);
      setError(err.message || 'Failed to load series');
    } finally {
      setLoading(false);
    }
  };

  const loadSeriesDetails = async (id: string) => {
    try {
      const data = await api.getSeriesById(id);
      setSeriesData(data);
      if (data.episodes && data.episodes.length > 0) {
        if (!selectedEpisodeId || !data.episodes.find((e: Episode) => e.id === selectedEpisodeId)) {
          setSelectedEpisodeId(data.episodes[0].id);
        }
      } else {
        setSelectedEpisodeId(null);
      }
    } catch (err: any) {
      console.error('Failed to load series details:', err);
      setError(err.message || 'Failed to load series details');
    }
  };

  const loadEpisodeDetails = async (id: string) => {
    try {
      const data = await api.getEpisodeById(id);
      setCurrentEpisode(data.episode);
      setLatestAnalysis(data.latest_analysis || null);
    } catch (err: any) {
      console.error('Failed to load episode:', err);
    }
  };

  const handleCreateSeries = async (data: { title: string; description?: string }) => {
    try {
      const newSeries = await api.createSeries(data);
      await loadSeriesList();
      setSelectedSeriesId(newSeries.id);
      setIsSeriesModalOpen(false);
    } catch (err: any) {
      console.error('Failed to create series:', err);
      alert(err.message || 'Could not create series');
    }
  };

  const handleCreateEpisode = async () => {
    if (!selectedSeriesId) return;
    try {
      const newEp = await api.createEpisode(selectedSeriesId, {
        title: `Episode ${(seriesData?.episodes?.length || 0) + 1}`,
        content: '',
      });
      await loadSeriesDetails(selectedSeriesId);
      setSelectedEpisodeId(newEp.id);
      setIsWizardOpen(false);
    } catch (err: any) {
      console.error('Failed to create episode:', err);
      alert(err.message || 'Could not create episode');
    }
  };

  const handleDeleteEpisode = async (episodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this episode?')) return;
    try {
      await api.deleteEpisode(episodeId);
      if (selectedSeriesId) {
        await loadSeriesDetails(selectedSeriesId);
      }
    } catch (err: any) {
      console.error('Failed to delete episode:', err);
    }
  };

  const handleUpdateScript = (newContent: string) => {
    if (currentEpisode) {
      setCurrentEpisode({ ...currentEpisode, content: newContent });
    }
  };

  const handleUpdateTitle = (newTitle: string) => {
    if (currentEpisode) {
      setCurrentEpisode({ ...currentEpisode, title: newTitle });
    }
  };

  const handleSaveDraft = async () => {
    if (!currentEpisode) return;
    try {
      await api.updateEpisode(currentEpisode.id, {
        title: currentEpisode.title,
        content: currentEpisode.content,
      });
      if (selectedSeriesId) {
        await loadSeriesDetails(selectedSeriesId);
      }
    } catch (err: any) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleLaunchWizard = async (step: number = 1) => {
    if (currentEpisode) {
      await handleSaveDraft();
      setWizardStartStep(step);
      setIsWizardOpen(true);
    }
  };

  const handleOpenAudioStudio = (ep: Episode, e: React.MouseEvent) => {
    e.stopPropagation();
    setAudioTargetEpisode(ep);
    setIsAudioStudioOpen(true);
  };

  const handleWizardComplete = async () => {
    setIsWizardOpen(false);
    if (selectedEpisodeId) {
      await loadEpisodeDetails(selectedEpisodeId);
    }
    if (selectedSeriesId) {
      await loadSeriesDetails(selectedSeriesId);
    }
  };

  return (
    <div className="app-container">
      <Header
        seriesList={seriesList}
        selectedSeriesId={selectedSeriesId}
        onSelectSeries={setSelectedSeriesId}
        onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
      />

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, marginTop: '1rem' }}>
        {/* Sidebar */}
        <EpisodeList
          episodes={seriesData?.episodes || []}
          selectedEpisodeId={selectedEpisodeId}
          onSelectEpisode={setSelectedEpisodeId}
          onCreateEpisode={handleCreateEpisode}
          onDeleteEpisode={handleDeleteEpisode}
          onOpenAudioStudio={handleOpenAudioStudio}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--ink-muted)' }}>
              <RotateCw size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-red)' }} />
              <div>Loading PocketVerse Command Center...</div>
            </div>
          ) : !selectedSeriesId ? (
            <div className="panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <h2>Welcome to PocketVerse</h2>
              <p className="text-muted" style={{ margin: '1rem 0 1.5rem 0' }}>
                Create your first serialized story to unlock AI continuity reviews and audio production.
              </p>
              <button className="btn btn-primary" onClick={() => setIsSeriesModalOpen(true)}>
                <PlusCircle size={16} /> Create Series
              </button>
            </div>
          ) : !currentEpisode ? (
            <div className="panel" style={{ textAlign: 'center', padding: '5rem 2rem' }}>
              <h2>No Episode Selected</h2>
              <p className="text-muted" style={{ margin: '1rem 0 1.5rem 0' }}>
                Select an episode from the sidebar or create a new episode to start writing.
              </p>
              <button className="btn btn-primary" onClick={handleCreateEpisode}>
                <PlusCircle size={16} /> Add Episode 1
              </button>
            </div>
          ) : isWizardOpen ? (
            <WizardContainer
              episode={currentEpisode}
              allEpisodes={seriesData?.episodes || []}
              initialStep={wizardStartStep}
              onClose={() => setIsWizardOpen(false)}
              onComplete={handleWizardComplete}
            />
          ) : currentEpisode.status === 'finalized' ? (
            <FinishedEpisodeView
              episode={currentEpisode}
              seriesTitle={seriesData?.title || 'Series'}
              analysisRun={latestAnalysis}
              onBackToEditor={() => setIsWizardOpen(true)}
            />
          ) : (
            <EpisodeEditor
              episode={currentEpisode}
              onUpdateTitle={handleUpdateTitle}
              onUpdateScript={handleUpdateScript}
              onSaveDraft={handleSaveDraft}
              onLaunchWizard={handleLaunchWizard}
            />
          )}
        </div>
      </div>

      {/* Series Modal */}
      {isSeriesModalOpen && (
        <SeriesModal
          onClose={() => setIsSeriesModalOpen(false)}
          onCreate={handleCreateSeries}
        />
      )}

      {/* Audio Studio Modal */}
      {isAudioStudioOpen && audioTargetEpisode && (
        <AudioStudioModal
          episode={audioTargetEpisode}
          seriesTitle={seriesData?.title || 'Series'}
          onClose={() => {
            setIsAudioStudioOpen(false);
            setAudioTargetEpisode(null);
          }}
          onEpisodeUpdated={async () => {
            if (selectedSeriesId) await loadSeriesDetails(selectedSeriesId);
            if (selectedEpisodeId) await loadEpisodeDetails(selectedEpisodeId);
          }}
        />
      )}
    </div>
  );
}

export default App;
