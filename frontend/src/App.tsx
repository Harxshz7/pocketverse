import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SeriesModal } from './components/SeriesModal';
import { EpisodeList } from './components/EpisodeList';
import { EpisodeEditor } from './components/EpisodeEditor';
import { FinishedEpisodeView } from './components/FinishedEpisodeView';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { AudioStudioModal } from './components/AudioStudioModal';
import { CreatorDashboard } from './components/CreatorDashboard';
import { Series, Episode, AnalysisRun } from './types';
import { api } from './api/client';
import { RotateCw, PlusCircle, LayoutDashboard, FileText } from 'lucide-react';

export function App() {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [seriesData, setSeriesData] = useState<Series | null>(null);

  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisRun | null>(null);

  // View Mode: 'dashboard' | 'editor' | 'wizard' | 'finalized'
  const [viewMode, setViewMode] = useState<'dashboard' | 'editor' | 'wizard' | 'finalized'>('dashboard');

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

  const handleCreateSeries = async (title: string) => {
    try {
      const newSeries = await api.createSeries({ title });
      await loadSeriesList();
      setSelectedSeriesId(newSeries.id);
      setIsSeriesModalOpen(false);
      setViewMode('dashboard');
    } catch (err: any) {
      console.error('Failed to create series:', err);
      alert(err.message || 'Could not create series');
    }
  };

  const handleCreateEpisode = async () => {
    if (!selectedSeriesId) return;
    try {
      const nextEpNumber = (seriesData?.episodes?.length || 0) + 1;
      const newEp = await api.createEpisode(selectedSeriesId, {
        title: `Episode ${nextEpNumber}`,
        content: '',
      });
      await loadSeriesDetails(selectedSeriesId);
      setSelectedEpisodeId(newEp.id);
      setViewMode('editor');
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
      if (selectedEpisodeId === episodeId) {
        setSelectedEpisodeId(null);
        setViewMode('dashboard');
      }
    } catch (err: any) {
      console.error('Failed to delete episode:', err);
    }
  };

  const handleSaveEpisodeContent = async (title: string, content: string) => {
    if (!currentEpisode) return;
    try {
      await api.updateEpisode(currentEpisode.id, { title, content });
      setCurrentEpisode({ ...currentEpisode, title, content });
      if (selectedSeriesId) {
        await loadSeriesDetails(selectedSeriesId);
      }
    } catch (err: any) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleLaunchWizard = (step: number = 1) => {
    setWizardStartStep(step);
    setIsWizardOpen(true);
    setViewMode('wizard');
  };

  const handleOpenAudioStudio = (ep: Episode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAudioTargetEpisode(ep);
    setIsAudioStudioOpen(true);
  };

  const handleWizardComplete = async () => {
    setIsWizardOpen(false);
    setViewMode('dashboard');
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
        selectedSeries={seriesData}
        onSelectSeries={(series: Series) => {
          setSelectedSeriesId(series.id);
          setViewMode('dashboard');
        }}
        onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
        onCreateEpisode={handleCreateEpisode}
      />

      {/* Creator Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button
            className={viewMode === 'dashboard' ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => setViewMode('dashboard')}
            style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
          >
            <LayoutDashboard size={15} /> Creator Dashboard
          </button>

          {currentEpisode && (
            <button
              className={viewMode === 'editor' ? 'btn btn-primary' : 'btn btn-secondary'}
              onClick={() => setViewMode('editor')}
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              <FileText size={15} /> Edit Episode {currentEpisode.episode_number}: "{currentEpisode.title}"
            </button>
          )}
        </div>

        {seriesData && (
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Active Series: <strong>{seriesData.title}</strong> ({seriesData.episodes?.length || 0} Episodes)
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1 }}>
        {/* Sidebar */}
        <EpisodeList
          episodes={seriesData?.episodes || []}
          selectedEpisodeId={selectedEpisodeId}
          onSelectEpisode={(epId) => {
            setSelectedEpisodeId(epId);
            setViewMode('editor');
          }}
          onCreateEpisode={handleCreateEpisode}
          onDeleteEpisode={handleDeleteEpisode}
          onOpenAudioStudio={handleOpenAudioStudio}
        />

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--ink-muted)' }}>
              <RotateCw size={32} className="spin" style={{ marginBottom: '1rem', color: 'var(--accent-red)' }} />
              <div>Loading PocketVerse Creator Command Center...</div>
            </div>
          ) : viewMode === 'dashboard' ? (
            <CreatorDashboard
              series={seriesData}
              seriesList={seriesList}
              selectedEpisodeId={selectedEpisodeId}
              onSelectSeries={(s) => setSelectedSeriesId(s.id)}
              onSelectEpisode={(epId) => {
                setSelectedEpisodeId(epId);
                setViewMode('editor');
              }}
              onCreateEpisode={handleCreateEpisode}
              onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
              onDeleteEpisode={handleDeleteEpisode}
              onOpenAudioStudio={handleOpenAudioStudio}
              onOpenWizard={(ep) => {
                setSelectedEpisodeId(ep.id);
                handleLaunchWizard(1);
              }}
              onRefreshSeries={async () => {
                if (selectedSeriesId) await loadSeriesDetails(selectedSeriesId);
              }}
            />
          ) : viewMode === 'wizard' && currentEpisode ? (
            <WizardContainer
              episode={currentEpisode}
              initialStep={wizardStartStep}
              onClose={() => setViewMode('dashboard')}
              onComplete={handleWizardComplete}
            />
          ) : viewMode === 'finalized' && currentEpisode ? (
            <FinishedEpisodeView
              episode={currentEpisode}
              seriesTitle={seriesData?.title || 'Series'}
              analysisRun={latestAnalysis}
              onBackToEditor={() => handleLaunchWizard(1)}
              onOpenAudioStudio={() => handleOpenAudioStudio(currentEpisode)}
            />
          ) : currentEpisode ? (
            <EpisodeEditor
              episode={currentEpisode}
              onSaveContent={handleSaveEpisodeContent}
              onLaunchWizard={() => handleLaunchWizard(1)}
              onViewFinalized={() => setViewMode('dashboard')}
            />
          ) : (
            <CreatorDashboard
              series={seriesData}
              seriesList={seriesList}
              selectedEpisodeId={selectedEpisodeId}
              onSelectSeries={(s) => setSelectedSeriesId(s.id)}
              onSelectEpisode={(epId) => {
                setSelectedEpisodeId(epId);
                setViewMode('editor');
              }}
              onCreateEpisode={handleCreateEpisode}
              onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
              onDeleteEpisode={handleDeleteEpisode}
              onOpenAudioStudio={handleOpenAudioStudio}
              onOpenWizard={(ep) => {
                setSelectedEpisodeId(ep.id);
                handleLaunchWizard(1);
              }}
              onRefreshSeries={async () => {
                if (selectedSeriesId) await loadSeriesDetails(selectedSeriesId);
              }}
            />
          )}
        </div>
      </div>

      {/* Series Modal */}
      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onCreateSeries={handleCreateSeries}
      />

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
