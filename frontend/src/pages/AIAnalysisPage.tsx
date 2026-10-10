import { useCallback, useEffect, useState } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileImage,
  FileVideo,
  Loader2,
  RefreshCw,
  Sparkles,
  Tags,
} from 'lucide-react';

import './AIAnalysisPage.css';

type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

interface Project {
  id: string;
  name: string;
}

interface MediaAsset {
  id: string;
  projectId: string;
  originalName: string;
  storagePath: string;
  thumbnailPath: string | null;
  mediaType: MediaType;
  mimeType: string;
  duration: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface AIAnalysis {
  id: string;
  mediaAssetId: string;
  summary: string;
  visualDescription: string | null;
  keywords: string[];
  model: string;
  createdAt: string;
}

interface APIResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:5002'
).replace(/\/$/, '');

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null) as APIResponse<T> | null;

  if (!response.ok || result?.success === false) {
    throw new Error(
      result?.error ||
      result?.message ||
      `Request failed with status ${response.status}`,
    );
  }

  return result?.data as T;
}

function getUploadUrl(storagePath: string | null): string | null {
  if (!storagePath) return null;

  const encodedPath = storagePath
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');

  return `${API_URL}/uploads/${encodedPath}`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function AIAnalysisPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [analyzingIds, setAnalyzingIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProjects = useCallback(async () => {
    setLoadingProjects(true);
    setError('');

    try {
      const result = await apiRequest<Project[]>('/api/projects');
      const projectList = Array.isArray(result) ? result : [];
      setProjects(projectList);
      setSelectedProjectId((current) => {
        if (current && projectList.some((project) => project.id === current)) {
          return current;
        }
        return projectList[0]?.id ?? '';
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load projects.');
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const loadMedia = useCallback(async () => {
    if (!selectedProjectId) {
      setMedia([]);
      setAnalyses({});
      return;
    }

    setLoadingMedia(true);
    setError('');
    setNotice('');

    try {
      const projectMedia = await apiRequest<MediaAsset[]>(
        `/api/projects/${selectedProjectId}/media`,
      );
      const assets = Array.isArray(projectMedia) ? projectMedia : [];
      setMedia(assets);

      const latestEntries = await Promise.all(
        assets.map(async (asset) => {
          try {
            const analysis = await apiRequest<AIAnalysis>(
              `/api/media/${asset.id}/analysis`,
            );
            return [asset.id, analysis] as const;
          } catch {
            return null;
          }
        }),
      );

      const nextAnalyses: Record<string, AIAnalysis> = {};
      for (const entry of latestEntries) {
        if (entry) nextAnalyses[entry[0]] = entry[1];
      }
      setAnalyses(nextAnalyses);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load media.');
    } finally {
      setLoadingMedia(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  async function analyze(asset: MediaAsset) {
    setAnalyzingIds((current) => [...current, asset.id]);
    setError('');
    setNotice('');

    try {
      const result = await apiRequest<AIAnalysis>(
        `/api/media/${asset.id}/analyze`,
        { method: 'POST' },
      );
      setAnalyses((current) => ({ ...current, [asset.id]: result }));
      setNotice(`Analysis completed for “${asset.originalName}”.`);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Unable to analyze this media.',
      );
    } finally {
      setAnalyzingIds((current) => current.filter((id) => id !== asset.id));
    }
  }

  const analyzableMedia = media.filter(
    (asset) => asset.mediaType === 'IMAGE' || asset.mediaType === 'VIDEO',
  );
  const analyzedCount = analyzableMedia.filter((asset) => analyses[asset.id]).length;

  return (
    <div className="ai-analysis-page">
      <header className="ai-analysis-header">
        <div>
          <span className="ai-analysis-eyebrow">AI WORKSPACE</span>
          <h1>Media Analysis</h1>
          <p>Analyze images and videos to extract visual descriptions, summaries, and keywords.</p>
        </div>
        <button
          type="button"
          className="ai-analysis-refresh"
          onClick={() => void loadMedia()}
          disabled={loadingMedia || !selectedProjectId}
          aria-label="Refresh media analysis"
          title="Refresh"
        >
          <RefreshCw size={17} className={loadingMedia ? 'ai-analysis-spin' : ''} />
          Refresh
        </button>
      </header>

      <section className="ai-analysis-toolbar">
        <label htmlFor="ai-analysis-project">Project</label>
        <select
          id="ai-analysis-project"
          value={selectedProjectId}
          onChange={(event) => setSelectedProjectId(event.target.value)}
          disabled={loadingProjects || projects.length === 0}
        >
          {projects.length === 0 && <option value="">No projects available</option>}
          {projects.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        <div className="ai-analysis-count">
          <Sparkles size={17} />
          <span>{analyzedCount} of {analyzableMedia.length} analyzed</span>
        </div>
      </section>

      {error && (
        <div className="ai-analysis-alert ai-analysis-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {notice && (
        <div className="ai-analysis-alert ai-analysis-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {loadingProjects || loadingMedia ? (
        <div className="ai-analysis-loading">
          <Loader2 size={28} className="ai-analysis-spin" />
          <span>{loadingProjects ? 'Loading projects…' : 'Loading project media…'}</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="ai-analysis-empty">
          <div className="ai-analysis-empty-icon"><Sparkles size={26} /></div>
          <h2>Create a project first</h2>
          <p>Upload images or videos to a project, then analyze them here.</p>
        </div>
      ) : media.length === 0 ? (
        <div className="ai-analysis-empty">
          <div className="ai-analysis-empty-icon"><FileImage size={26} /></div>
          <h2>No media in this project</h2>
          <p>Upload images or videos in the Media Library to get started.</p>
        </div>
      ) : (
        <div className="ai-analysis-grid">
          {media.map((asset) => {
            const analysis = analyses[asset.id];
            const analyzing = analyzingIds.includes(asset.id);
            const supported = asset.mediaType === 'IMAGE' || asset.mediaType === 'VIDEO';
            const thumbnailUrl = getUploadUrl(asset.thumbnailPath);
            const Icon = asset.mediaType === 'VIDEO' ? FileVideo : FileImage;

            return (
              <article className="ai-analysis-card" key={asset.id}>
                <div className="ai-analysis-card-media">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="" loading="lazy" />
                  ) : (
                    <div className="ai-analysis-card-placeholder"><Icon size={30} /></div>
                  )}
                  <span className={`ai-analysis-type ai-analysis-type-${asset.mediaType.toLowerCase()}`}>
                    {asset.mediaType}
                  </span>
                </div>

                <div className="ai-analysis-card-body">
                  <div className="ai-analysis-card-title">
                    <h2 title={asset.originalName}>{asset.originalName}</h2>
                    {analysis && <span className="ai-analysis-complete"><CheckCircle2 size={15} /> Analyzed</span>}
                  </div>

                  {analysis ? (
                    <>
                      <section className="ai-analysis-result-section">
                        <h3><Sparkles size={15} /> Summary</h3>
                        <p>{analysis.summary}</p>
                      </section>

                      {analysis.visualDescription && (
                        <section className="ai-analysis-result-section">
                          <h3>Visual description</h3>
                          <p>{analysis.visualDescription}</p>
                        </section>
                      )}

                      <section className="ai-analysis-result-section">
                        <h3><Tags size={15} /> Keywords</h3>
                        <div className="ai-analysis-keywords">
                          {analysis.keywords.map((keyword, index) => (
                            <span key={`${keyword}-${index}`}>{keyword}</span>
                          ))}
                        </div>
                      </section>

                      <div className="ai-analysis-result-meta">
                        <span><Clock3 size={14} /> {formatDate(analysis.createdAt)}</span>
                        <span>{analysis.model}</span>
                      </div>
                    </>
                  ) : (
                    <p className="ai-analysis-not-run">
                      {supported
                        ? 'This media has not been analyzed yet.'
                        : 'Audio analysis is not available in this release.'}
                    </p>
                  )}

                  <button
                    type="button"
                    className="ai-analysis-run-button"
                    onClick={() => void analyze(asset)}
                    disabled={!supported || analyzing}
                  >
                    {analyzing ? (
                      <><Loader2 size={16} className="ai-analysis-spin" /> Analyzing…</>
                    ) : (
                      <><Sparkles size={16} /> {analysis ? 'Analyze again' : 'Analyze media'}</>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
