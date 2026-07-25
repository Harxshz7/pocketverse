import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SeriesModal } from './components/SeriesModal';
import { EpisodeList } from './components/EpisodeList';
import { EpisodeEditor } from './components/EpisodeEditor';
import { FinishedEpisodeView } from './components/FinishedEpisodeView';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { Series, Episode } from './types';
import {
  fetchSeriesList,
  createSeries,
  fetchSeriesById,
  createEpisode,
  fetchEpisodeById,
  updateEpisode,
  deleteEpisode,
} from './api/client';
import { Layers, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<(Episode & { series_title?: string; analysis_run?: any }) | null>(null);

  // Modals & Views
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState<boolean>(false);
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'editor' | 'reader'>('editor');

  const [loading, setLoading] = useState<boolean>(true);

  // Initial load
  useEffect(() => {
    loadSeriesData();
  }, []);

  const loadSeriesData = async () => {
    setLoading(true);
    try {
      const list = await fetchSeriesList();
      setSeriesList(list);

      if (list.length > 0) {
        const active = list[0];
        await handleSelectSeries(active);
      } else {
        setSelectedSeries(null);
        setEpisodes([]);
        setSelectedEpisode(null);
      }
    } catch (err: any) {
      console.error('Failed to load series data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSeries = async (series: Series) => {
    setSelectedSeries(series);
    try {
      const fullSeries = await fetchSeriesById(series.id);
      const epList = fullSeries.episodes || [];
      setEpisodes(epList);

      if (epList.length > 0) {
        await handleSelectEpisode(epList[0].id);
      } else {
        setSelectedEpisode(null);
      }
    } catch (err: any) {
      console.error('Error fetching series details:', err);
    }
  };

  const handleSelectEpisode = async (episodeId: string) => {
    try {
      const fullEp = await fetchEpisodeById(episodeId);
      setSelectedEpisode(fullEp);
      setViewMode(fullEp.status === 'finalized' ? 'reader' : 'editor');
    } catch (err: any) {
      console.error('Error fetching episode:', err);
    }
  };

  const handleCreateSeries = async (title: string) => {
    const newSeries = await createSeries(title);
    const updatedList = await fetchSeriesList();
    setSeriesList(updatedList);
    await handleSelectSeries(newSeries);
  };

  const handleCreateEpisode = async () => {
    if (!selectedSeries) return;
    try {
      const nextEpNum = episodes.length + 1;
      const title = `Episode ${nextEpNum}: Chapter Title`;
      const initialContent = ''; // Clean empty content for user to paste/write their story

      const newEp = await createEpisode(selectedSeries.id, title, initialContent);
      
      const fullSeries = await fetchSeriesById(selectedSeries.id);
      setEpisodes(fullSeries.episodes || []);
      await handleSelectEpisode(newEp.id);
    } catch (err: any) {
      console.error('Error creating episode:', err);
    }
  };

  const handleSaveEpisodeContent = async (title: string, content: string) => {
    if (!selectedEpisode) return;
    try {
      const updated = await updateEpisode(selectedEpisode.id, title, content);
      setSelectedEpisode(prev => prev ? { ...prev, title: updated.title, content: updated.content } : null);
      
      setEpisodes(prev =>
        prev.map(e => e.id === updated.id ? { ...e, title: updated.title, content: updated.content } : e)
      );
    } catch (err: any) {
      console.error('Error saving episode:', err);
    }
  };

  const handleDeleteEpisode = async (episodeId: string) => {
    try {
      await deleteEpisode(episodeId);
      if (selectedSeries) {
        const fullSeries = await fetchSeriesById(selectedSeries.id);
        const epList = fullSeries.episodes || [];
        setEpisodes(epList);
        if (epList.length > 0) {
          await handleSelectEpisode(epList[0].id);
        } else {
          setSelectedEpisode(null);
        }
      }
    } catch (err: any) {
      console.error('Error deleting episode:', err);
    }
  };

  const handleWizardFinished = async (finalizedEpisode: Episode) => {
    setIsWizardOpen(false);
    if (selectedSeries) {
      const fullSeries = await fetchSeriesById(selectedSeries.id);
      setEpisodes(fullSeries.episodes || []);
    }
    await handleSelectEpisode(finalizedEpisode.id);
    setViewMode('reader');
  };

  return (
    <div className="app-container">
      <div className="hero-glow" />

      <Header
        seriesList={seriesList}
        selectedSeries={selectedSeries}
        onSelectSeries={handleSelectSeries}
        onOpenNewSeriesModal={() => setIsSeriesModalOpen(true)}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            border: '3px solid var(--border-accent)',
            borderTopColor: 'var(--accent-red)',
            animation: 'spin 1s infinite linear',
            margin: '0 auto 1rem',
          }} />
          <h3 className="heading-grotesk">INITIALIZING COMMAND CENTER...</h3>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      ) : seriesList.length === 0 ? (
        <main className="panel panel-accent" style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          maxWidth: '700px',
          margin: '3rem auto',
          position: 'relative',
          zIndex: 2,
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--accent-red-subtle)',
            border: '1px solid var(--border-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: 'var(--shadow-glow)',
          }}>
            <Layers size={32} className="accent-text" />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>
            WELCOME TO POCKET<span className="accent-text">VERSE</span>
          </h2>
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.95rem', marginBottom: '2rem', lineHeight: 1.7 }}>
            The production-grade command center for serialized story creators. Build multi-episode series with OpenAI-powered continuity checks, copyediting, and genre remixing before publishing.
          </p>

          <button className="btn btn-primary" onClick={() => setIsSeriesModalOpen(true)} style={{ padding: '0.85rem 2rem' }}>
            <Plus size={18} />
            Create Your First Series
          </button>
        </main>
      ) : (
        <div style={{ display: 'flex', gap: '1.5rem', flex: 1, position: 'relative', zIndex: 2 }}>
          {selectedSeries && (
            <EpisodeList
              series={selectedSeries}
              episodes={episodes}
              selectedEpisodeId={selectedEpisode?.id || null}
              onSelectEpisode={(ep) => handleSelectEpisode(ep.id)}
              onCreateEpisode={handleCreateEpisode}
              onDeleteEpisode={handleDeleteEpisode}
            />
          )}

          {selectedEpisode ? (
            viewMode === 'reader' ? (
              <FinishedEpisodeView
                episode={selectedEpisode}
                seriesTitle={selectedSeries?.title || ''}
                analysisRun={selectedEpisode.analysis_run}
                onBackToEditor={() => setViewMode('editor')}
              />
            ) : (
              <EpisodeEditor
                episode={selectedEpisode}
                onSaveContent={handleSaveEpisodeContent}
                onLaunchWizard={() => setIsWizardOpen(true)}
                onViewFinalized={() => setViewMode('reader')}
              />
            )
          ) : (
            <main className="panel" style={{ flex: 1, textAlign: 'center', padding: '4rem 2rem', color: 'var(--ink-muted)' }}>
              <p>No episode selected. Choose an episode from the sidebar or click "Add Episode".</p>
            </main>
          )}
        </div>
      )}

      <SeriesModal
        isOpen={isSeriesModalOpen}
        onClose={() => setIsSeriesModalOpen(false)}
        onCreateSeries={handleCreateSeries}
      />

      {isWizardOpen && selectedEpisode && (
        <WizardContainer
          episode={selectedEpisode}
          onClose={() => setIsWizardOpen(false)}
          onFinished={handleWizardFinished}
        />
      )}
    </div>
  );
};
