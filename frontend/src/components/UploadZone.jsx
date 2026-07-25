import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UploadZone({ onSubmit, loading = false }) {
  const [mode, setMode] = useState('paste'); // 'paste' | 'drag'
  const [title, setTitle] = useState('');
  const [episodeNumber, setEpisodeNumber] = useState('');
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
    if (!title.trim()) return setError('Episode title is required');
    if (!episodeNumber) return setError('Episode number is required');
    if (!text.trim()) return setError('Episode text is required');
    setError('');
    onSubmit({
      number: parseInt(episodeNumber, 10),
      title: title.trim(),
      raw_text: text.trim(),
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText(ev.target.result);
        if (!title) setTitle(file.name.replace('.txt', ''));
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setText(ev.target.result);
        if (!title) setTitle(file.name.replace('.txt', ''));
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Episode metadata */}
      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4">
        <div>
          <label className="block text-xs font-bold tracking-wider text-verse-text-muted uppercase mono mb-2">
            Episode #
          </label>
          <input
            type="number"
            min="1"
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(e.target.value)}
            placeholder="1"
            className="w-full px-3 py-2.5 bg-verse-black border border-verse-border rounded-lg text-verse-text mono text-center text-lg focus:outline-none focus:border-verse-red/50 focus:ring-1 focus:ring-verse-red/20 transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-bold tracking-wider text-verse-text-muted uppercase mono mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Episode title..."
            className="w-full px-4 py-2.5 bg-verse-black border border-verse-border rounded-lg text-verse-text focus:outline-none focus:border-verse-red/50 focus:ring-1 focus:ring-verse-red/20 transition-all"
          />
        </div>
      </div>

      {/* Drop zone / paste area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer
          ${dragOver
            ? 'border-verse-red bg-verse-red/5 shadow-[0_0_30px_rgba(232,32,63,0.15)]'
            : 'border-verse-border hover:border-verse-border-light'
          }
          ${text ? 'border-verse-green/30' : ''}
        `}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !text && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!text ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-3 rounded-full bg-verse-surface border border-verse-border">
              <Upload size={24} className="text-verse-text-muted" />
            </div>
            <div>
              <p className="text-verse-text font-medium">
                Drop a text file or click to browse
              </p>
              <p className="text-verse-text-muted text-sm mt-1">
                Or paste your episode text below
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-verse-green shrink-0" />
            <span className="text-verse-green text-sm font-medium">
              {text.length.toLocaleString()} characters loaded
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setText(''); }}
              className="ml-auto text-verse-text-muted hover:text-verse-red text-xs"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Text paste area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Or paste your episode text here..."
        rows={10}
        className="w-full px-4 py-3 bg-verse-black border border-verse-border rounded-xl text-verse-text text-sm leading-relaxed resize-y focus:outline-none focus:border-verse-red/50 focus:ring-1 focus:ring-verse-red/20 transition-all placeholder:text-verse-text-muted/50"
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-verse-red text-sm animate-fade-in">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || !text.trim()}
          className="btn-primary"
        >
          {loading ? (
            <>
              <div className="spinner !w-4 !h-4 !border-white/30 !border-t-white" />
              Processing...
            </>
          ) : (
            <>
              <FileText size={16} />
              Ingest Episode
            </>
          )}
        </button>
      </div>
    </div>
  );
}
