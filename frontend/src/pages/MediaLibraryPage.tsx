import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import type {
  ChangeEvent,
  DragEvent,
} from 'react';

import {
  AlertCircle,
  FileAudio,
  FileImage,
  FileVideo,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  Music,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from 'lucide-react';

import './MediaLibraryPage.css';

type MediaType =
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO';

interface Project {
  id: string;
  name: string;
}

interface MediaAsset {
  id: string;
  projectId: string;
  originalName: string;
  filename: string;
  storagePath: string;
  thumbnailPath: string | null;
  mimeType: string;
  mediaType: MediaType;
  sizeBytes: string | number;
  duration: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
  updatedAt: string;
}

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://127.0.0.1:5002'
).replace(/\/$/, '');

const MAX_FILE_SIZE =
  100 * 1024 * 1024;

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/aac',
  'audio/flac',
  'audio/webm',
];

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    options,
  );

  const result = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        `Request failed with status ${response.status}`,
    );
  }

  if (result?.success === false) {
    throw new Error(
      result.error ||
        result.message ||
        'Request failed',
    );
  }

  return result as T;
}

function unwrapProjects(
  result: any,
): Project[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.projects)) {
    return result.projects;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (
    Array.isArray(
      result?.data?.projects,
    )
  ) {
    return result.data.projects;
  }

  return [];
}

function unwrapMedia(
  result: any,
): MediaAsset[] {
  if (Array.isArray(result)) {
    return result;
  }

  if (Array.isArray(result?.media)) {
    return result.media;
  }

  if (Array.isArray(result?.data)) {
    return result.data;
  }

  if (
    Array.isArray(
      result?.data?.media,
    )
  ) {
    return result.data.media;
  }

  return [];
}

function getMediaUrl(
  storagePath: string,
): string {
  const normalizedPath =
    storagePath
      .split('/')
      .map((part) =>
        encodeURIComponent(part),
      )
      .join('/');

  return `${API_URL}/uploads/${normalizedPath}`;
}

function getThumbnailUrl(
  thumbnailPath: string | null,
): string | null {
  if (!thumbnailPath) {
    return null;
  }

  return getMediaUrl(thumbnailPath);
}

function formatFileSize(
  size: string | number,
): string {
  const bytes = Number(size);

  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return '0 B';
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 * 1024 * 1024
  ) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function formatDate(
  date: string,
): string {
  if (!date) {
    return '—';
  }

  return new Intl.DateTimeFormat(
    'es-ES',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(date));
}

function formatDuration(
  duration: number | null,
): string {
  if (
    duration === null ||
    !Number.isFinite(duration) ||
    duration < 0
  ) {
    return '—';
  }

  const totalSeconds =
    Math.round(duration);

  const hours =
    Math.floor(
      totalSeconds / 3600,
    );

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  const seconds =
    totalSeconds % 60;

  if (hours > 0) {
    return [
      hours
        .toString()
        .padStart(2, '0'),
      minutes
        .toString()
        .padStart(2, '0'),
      seconds
        .toString()
        .padStart(2, '0'),
    ].join(':');
  }

  return [
    minutes
      .toString()
      .padStart(2, '0'),
    seconds
      .toString()
      .padStart(2, '0'),
  ].join(':');
}

function getProjectName(
  projects: Project[],
  projectId: string,
): string {
  return (
    projects.find(
      (project) =>
        project.id === projectId,
    )?.name ||
    'Unknown project'
  );
}

function isImage(
  media: MediaAsset,
): boolean {
  return media.mediaType === 'IMAGE';
}

function isVideo(
  media: MediaAsset,
): boolean {
  return media.mediaType === 'VIDEO';
}

function isAudio(
  media: MediaAsset,
): boolean {
  return media.mediaType === 'AUDIO';
}

export default function MediaLibraryPage() {
  const [media, setMedia] =
    useState<MediaAsset[]>([]);

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [projectsLoading, setProjectsLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [selectedProjectId, setSelectedProjectId] =
    useState('all');

  const [selectedType, setSelectedType] =
    useState<'ALL' | MediaType>(
      'ALL',
    );

  const [uploadModalOpen, setUploadModalOpen] =
    useState(false);

  const [uploadProjectId, setUploadProjectId] =
    useState('');

  const [selectedFiles, setSelectedFiles] =
    useState<File[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState('');

  const [uploadProgress, setUploadProgress] =
    useState(0);

  const [previewMedia, setPreviewMedia] =
    useState<MediaAsset | null>(null);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const loadProjects =
    useCallback(async () => {
      setProjectsLoading(true);

      try {
        const result =
          await apiRequest<any>(
            '/api/projects',
          );

        setProjects(
          unwrapProjects(result),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load projects.',
        );
      } finally {
        setProjectsLoading(false);
      }
    }, []);

  const loadMedia =
    useCallback(async () => {
      setLoading(true);
      setError('');

      try {
        if (
          selectedProjectId === 'all'
        ) {
          const projectResult =
            await apiRequest<any>(
              '/api/projects',
            );

          const projectList =
            unwrapProjects(
              projectResult,
            );

          const mediaResults =
            await Promise.all(
              projectList.map(
                async (project) => {
                  try {
                    const result =
                      await apiRequest<any>(
                        `/api/projects/${project.id}/media`,
                      );

                    return unwrapMedia(
                      result,
                    );
                  } catch {
                    return [];
                  }
                },
              ),
            );

          setMedia(
            mediaResults.flat(),
          );
        } else {
          const result =
            await apiRequest<any>(
              `/api/projects/${selectedProjectId}/media`,
            );

          setMedia(
            unwrapMedia(result),
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load media.',
        );
      } finally {
        setLoading(false);
      }
    }, [selectedProjectId]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    void loadMedia();
  }, [loadMedia]);

  useEffect(() => {
    if (!previewMedia) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        setPreviewMedia(null);
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown,
      );
    };
  }, [previewMedia]);

  const filteredMedia =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return media.filter(
        (item) => {
          const matchesSearch =
            !query ||
            item.originalName
              .toLowerCase()
              .includes(query) ||
            getProjectName(
              projects,
              item.projectId,
            )
              .toLowerCase()
              .includes(query);

          const matchesType =
            selectedType === 'ALL' ||
            item.mediaType ===
              selectedType;

          return (
            matchesSearch &&
            matchesType
          );
        },
      );
    }, [
      media,
      projects,
      search,
      selectedType,
    ]);

  const imageCount =
    media.filter(
      (item) =>
        item.mediaType === 'IMAGE',
    ).length;

  const videoCount =
    media.filter(
      (item) =>
        item.mediaType === 'VIDEO',
    ).length;

  const audioCount =
    media.filter(
      (item) =>
        item.mediaType === 'AUDIO',
    ).length;

  function openUploadModal() {
    setUploadProjectId(
      projects.length > 0
        ? projects[0].id
        : '',
    );

    setSelectedFiles([]);
    setUploadError('');
    setUploadProgress(0);
    setUploadModalOpen(true);
  }

  function closeUploadModal() {
    if (uploading) {
      return;
    }

    setUploadModalOpen(false);
    setSelectedFiles([]);
    setUploadError('');
    setUploadProgress(0);
  }

  function validateFiles(
    files: File[],
  ): File[] {
    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (
        !ACCEPTED_TYPES.includes(
          file.type,
        )
      ) {
        errors.push(
          `${file.name}: file type is not supported.`,
        );

        continue;
      }

      if (
        file.size > MAX_FILE_SIZE
      ) {
        errors.push(
          `${file.name}: maximum file size is 100 MB.`,
        );

        continue;
      }

      validFiles.push(file);
    }

    setUploadError(
      errors.length > 0
        ? errors.join(' ')
        : '',
    );

    return validFiles;
  }

  function addFiles(
    files: File[],
  ) {
    const validFiles =
      validateFiles(files);

    setSelectedFiles(
      (current) => {
        const existing =
          new Set(
            current.map(
              (file) =>
                `${file.name}-${file.size}-${file.lastModified}`,
            ),
          );

        return [
          ...current,
          ...validFiles.filter(
            (file) =>
              !existing.has(
                `${file.name}-${file.size}-${file.lastModified}`,
              ),
          ),
        ];
      },
    );
  }

  function handleFileInput(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(
      event.target.files ?? [],
    );

    if (files.length > 0) {
      addFiles(files);
    }

    event.target.value = '';
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();

    const files = Array.from(
      event.dataTransfer.files,
    );

    if (files.length > 0) {
      addFiles(files);
    }
  }

  function removeSelectedFile(
    index: number,
  ) {
    setSelectedFiles(
      (current) =>
        current.filter(
          (_, fileIndex) =>
            fileIndex !== index,
        ),
    );
  }

  async function uploadFiles() {
    if (!uploadProjectId) {
      setUploadError(
        'Please select a project.',
      );

      return;
    }

    if (
      selectedFiles.length === 0
    ) {
      setUploadError(
        'Please select at least one file.',
      );

      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      for (
        let index = 0;
        index < selectedFiles.length;
        index++
      ) {
        const file =
          selectedFiles[index];

        const formData =
          new FormData();

        formData.append(
          'file',
          file,
        );

        const response =
          await fetch(
            `${API_URL}/api/projects/${uploadProjectId}/media`,
            {
              method: 'POST',
              body: formData,
            },
          );

        const result =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            result?.error ||
              result?.message ||
              `Unable to upload ${file.name}.`,
          );
        }

        setUploadProgress(
          Math.round(
            ((index + 1) /
              selectedFiles.length) *
              100,
          ),
        );
      }

      setUploadModalOpen(false);
      setSelectedFiles([]);

      await loadMedia();
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : 'Unable to upload files.',
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteMedia(
    item: MediaAsset,
  ) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${item.originalName}"?`,
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setError('');

    try {
      await apiRequest(
        `/api/media/${item.id}`,
        {
          method: 'DELETE',
        },
      );

      setMedia(
        (current) =>
          current.filter(
            (mediaItem) =>
              mediaItem.id !==
              item.id,
          ),
      );

      if (
        previewMedia?.id ===
        item.id
      ) {
        setPreviewMedia(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to delete media.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  function renderMetadata(
    item: MediaAsset,
  ) {
    const dimensions =
      item.width !== null &&
      item.height !== null
        ? `${item.width} × ${item.height} px`
        : '—';

    return (
      <div className="media-preview-metadata">
        <div className="media-preview-metadata-header">
          <strong>
            Media metadata
          </strong>
        </div>

        <div className="media-preview-metadata-grid">
          <div className="media-preview-metadata-item">
            <span>Type</span>
            <strong>
              {item.mediaType}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Format</span>
            <strong>
              {item.mimeType}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Size</span>
            <strong>
              {formatFileSize(
                item.sizeBytes,
              )}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Dimensions</span>
            <strong>
              {dimensions}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Duration</span>
            <strong>
              {formatDuration(
                item.duration,
              )}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Created</span>
            <strong>
              {formatDate(
                item.createdAt,
              )}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Updated</span>
            <strong>
              {formatDate(
                item.updatedAt,
              )}
            </strong>
          </div>

          <div className="media-preview-metadata-item">
            <span>Project</span>
            <strong>
              {getProjectName(
                projects,
                item.projectId,
              )}
            </strong>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="media-library-page">
      <div className="media-library-header">
        <div>
          <span className="media-library-eyebrow">
            WORKSPACE
          </span>

          <h1>
            Media Library
          </h1>

          <p>
            Manage the images,
            videos, and audio used
            in your social content.
          </p>
        </div>

        <button
          type="button"
          className="media-primary-button"
          onClick={
            openUploadModal
          }
          disabled={
            projectsLoading ||
            projects.length === 0
          }
        >
          <Plus size={18} />
          Upload media
        </button>
      </div>

      <div className="media-statistics">
        <button
          type="button"
          className={`media-stat-card ${
            selectedType === 'ALL'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setSelectedType('ALL')
          }
        >
          <div className="media-stat-icon all">
            <FolderOpen size={20} />
          </div>

          <div>
            <strong>
              {media.length}
            </strong>

            <span>
              Total media
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`media-stat-card ${
            selectedType === 'IMAGE'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setSelectedType('IMAGE')
          }
        >
          <div className="media-stat-icon image">
            <ImageIcon size={20} />
          </div>

          <div>
            <strong>
              {imageCount}
            </strong>

            <span>
              Images
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`media-stat-card ${
            selectedType === 'VIDEO'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setSelectedType('VIDEO')
          }
        >
          <div className="media-stat-icon video">
            <Video size={20} />
          </div>

          <div>
            <strong>
              {videoCount}
            </strong>

            <span>
              Videos
            </span>
          </div>
        </button>

        <button
          type="button"
          className={`media-stat-card ${
            selectedType === 'AUDIO'
              ? 'active'
              : ''
          }`}
          onClick={() =>
            setSelectedType('AUDIO')
          }
        >
          <div className="media-stat-icon audio">
            <Music size={20} />
          </div>

          <div>
            <strong>
              {audioCount}
            </strong>

            <span>
              Audio
            </span>
          </div>
        </button>
      </div>

      <div className="media-toolbar">
        <div className="media-search">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search media..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch('')
              }
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          className="media-project-filter"
          value={selectedProjectId}
          onChange={(event) =>
            setSelectedProjectId(
              event.target.value,
            )
          }
        >
          <option value="all">
            All projects
          </option>

          {projects.map(
            (project) => (
              <option
                key={project.id}
                value={project.id}
              >
                {project.name}
              </option>
            ),
          )}
        </select>

        <button
          type="button"
          className="media-refresh-button"
          onClick={() =>
            void loadMedia()
          }
          disabled={loading}
          title="Refresh"
          aria-label="Refresh media"
        >
          <RefreshCw
            size={17}
            className={
              loading
                ? 'media-spin'
                : ''
            }
          />
        </button>
      </div>

      {error && (
        <div className="media-error-banner">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              void loadMedia()
            }
          >
            Retry
          </button>
        </div>
      )}

      <div className="media-section-heading">
        <div>
          <h2>
            All media
          </h2>

          <span>
            {filteredMedia.length}{' '}
            {filteredMedia.length ===
            1
              ? 'file'
              : 'files'}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="media-loading">
          <Loader2
            size={28}
            className="media-spin"
          />

          <span>
            Loading media...
          </span>
        </div>
      ) : filteredMedia.length ===
        0 ? (
        <div className="media-empty">
          <div className="media-empty-icon">
            <FolderOpen size={30} />
          </div>

          <h3>
            {search ||
            selectedType !== 'ALL' ||
            selectedProjectId !==
              'all'
              ? 'No media found'
              : 'Your media library is empty'}
          </h3>

          <p>
            {search ||
            selectedType !== 'ALL' ||
            selectedProjectId !==
              'all'
              ? 'Try changing your filters or search term.'
              : 'Upload images, videos, or audio files to get started.'}
          </p>

          {!search &&
            selectedType === 'ALL' &&
            selectedProjectId ===
              'all' &&
            projects.length > 0 && (
              <button
                type="button"
                className="media-primary-button"
                onClick={
                  openUploadModal
                }
              >
                <Upload size={18} />
                Upload media
              </button>
            )}
        </div>
      ) : (
        <div className="media-grid">
          {filteredMedia.map(
            (item) => {
              const mediaUrl =
                getMediaUrl(
                  item.storagePath,
                );

              const thumbnailUrl =
                getThumbnailUrl(
                  item.thumbnailPath,
                );

              return (
                <article
                  className="media-card"
                  key={item.id}
                >
                  <button
                    type="button"
                    className="media-preview"
                    onClick={() =>
                      setPreviewMedia(
                        item,
                      )
                    }
                    aria-label={`Preview ${item.originalName}`}
                  >
                    {isImage(item) ? (
                      <img
                        src={
                          thumbnailUrl ||
                          mediaUrl
                        }
                        alt={
                          item.originalName
                        }
                      />
                    ) : isVideo(
                        item,
                      ) ? (
                      <>
                        {thumbnailUrl ? (
                          <img
                            src={
                              thumbnailUrl
                            }
                            alt={
                              item.originalName
                            }
                          />
                        ) : (
                          <video
                            src={
                              mediaUrl
                            }
                            preload="metadata"
                          />
                        )}

                        <span className="media-preview-play">
                          <Play
                            size={20}
                            fill="currentColor"
                          />
                        </span>
                      </>
                    ) : (
                      <div className="media-audio-preview">
                        <Music
                          size={38}
                        />
                      </div>
                    )}

                    <span
                      className={`media-type-badge ${item.mediaType.toLowerCase()}`}
                    >
                      {item.mediaType}
                    </span>
                  </button>

                  <div className="media-card-content">
                    <h3
                      title={
                        item.originalName
                      }
                    >
                      {
                        item.originalName
                      }
                    </h3>

                    <p>
                      {getProjectName(
                        projects,
                        item.projectId,
                      )}
                    </p>

                    <div className="media-card-meta">
                      <span>
                        {formatFileSize(
                          item.sizeBytes,
                        )}
                      </span>

                      <span>
                        {formatDate(
                          item.createdAt,
                        )}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="media-delete-button"
                    onClick={() =>
                      void deleteMedia(
                        item,
                      )
                    }
                    disabled={
                      deletingId ===
                      item.id
                    }
                    title="Delete media"
                    aria-label={`Delete ${item.originalName}`}
                  >
                    {deletingId ===
                    item.id ? (
                      <Loader2
                        size={16}
                        className="media-spin"
                      />
                    ) : (
                      <Trash2
                        size={16}
                      />
                    )}
                  </button>
                </article>
              );
            },
          )}
        </div>
      )}

      {uploadModalOpen && (
        <div
          className="media-modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeUploadModal();
            }
          }}
        >
          <div className="media-modal">
            <div className="media-modal-header">
              <div>
                <h2>
                  Upload media
                </h2>

                <p>
                  Add images, videos,
                  or audio to a
                  project.
                </p>
              </div>

              <button
                type="button"
                className="media-modal-close"
                onClick={
                  closeUploadModal
                }
                disabled={uploading}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="media-form-group">
              <label htmlFor="media-project">
                Project{' '}
                <span>*</span>
              </label>

              <select
                id="media-project"
                value={
                  uploadProjectId
                }
                onChange={(event) =>
                  setUploadProjectId(
                    event.target
                      .value,
                  )
                }
                disabled={uploading}
              >
                <option value="">
                  Select a project
                </option>

                {projects.map(
                  (project) => (
                    <option
                      key={
                        project.id
                      }
                      value={
                        project.id
                      }
                    >
                      {
                        project.name
                      }
                    </option>
                  ),
                )}
              </select>
            </div>

            <div
              className="media-drop-zone"
              onDragOver={(event) =>
                event.preventDefault()
              }
              onDrop={handleDrop}
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <div className="media-drop-icon">
                <Upload size={24} />
              </div>

              <h3>
                Drop files here
              </h3>

              <p>
                or{' '}
                <strong>
                  browse from your
                  computer
                </strong>
              </p>

              <span>
                Images, videos and
                audio · Maximum 100 MB
                per file
              </span>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                multiple
                accept={ACCEPTED_TYPES.join(
                  ',',
                )}
                onChange={
                  handleFileInput
                }
              />
            </div>

            {selectedFiles.length >
              0 && (
              <div className="selected-files">
                <div className="selected-files-heading">
                  <strong>
                    Selected files (
                    {
                      selectedFiles.length
                    }
                    )
                  </strong>
                </div>

                {selectedFiles.map(
                  (
                    file,
                    index,
                  ) => (
                    <div
                      className="selected-file"
                      key={`${file.name}-${file.size}-${file.lastModified}`}
                    >
                      <div className="selected-file-icon">
                        {file.type.startsWith(
                          'image/',
                        ) ? (
                          <FileImage
                            size={18}
                          />
                        ) : file.type.startsWith(
                            'video/',
                          ) ? (
                          <FileVideo
                            size={18}
                          />
                        ) : (
                          <FileAudio
                            size={18}
                          />
                        )}
                      </div>

                      <div className="selected-file-info">
                        <strong
                          title={
                            file.name
                          }
                        >
                          {file.name}
                        </strong>

                        <span>
                          {formatFileSize(
                            file.size,
                          )}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeSelectedFile(
                            index,
                          )
                        }
                        disabled={
                          uploading
                        }
                        aria-label={`Remove ${file.name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ),
                )}
              </div>
            )}

            {uploadError && (
              <div className="media-upload-error">
                <AlertCircle
                  size={16}
                />

                <span>
                  {uploadError}
                </span>
              </div>
            )}

            {uploading && (
              <div className="media-upload-progress">
                <div className="media-upload-progress-header">
                  <span>
                    Uploading...
                  </span>

                  <strong>
                    {uploadProgress}%
                  </strong>
                </div>

                <div className="media-progress-track">
                  <div
                    className="media-progress-bar"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="media-modal-actions">
              <button
                type="button"
                className="media-secondary-button"
                onClick={
                  closeUploadModal
                }
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="button"
                className="media-primary-button"
                onClick={() =>
                  void uploadFiles()
                }
                disabled={
                  uploading ||
                  selectedFiles.length ===
                    0 ||
                  !uploadProjectId
                }
              >
                {uploading ? (
                  <>
                    <Loader2
                      size={17}
                      className="media-spin"
                    />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload
                      size={17}
                    />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewMedia && (
        <div
          className="media-preview-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreviewMedia(null);
            }
          }}
        >
          <div className="media-preview-modal">
            <div className="media-preview-modal-header">
              <div>
                <h2
                  title={
                    previewMedia.originalName
                  }
                >
                  {
                    previewMedia.originalName
                  }
                </h2>

                <span>
                  {getProjectName(
                    projects,
                    previewMedia.projectId,
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewMedia(
                    null,
                  )
                }
                aria-label="Close preview"
              >
                <X size={21} />
              </button>
            </div>

            <div className="media-preview-content">
              {isImage(
                previewMedia,
              ) && (
                <img
                  src={getMediaUrl(
                    previewMedia.storagePath,
                  )}
                  alt={
                    previewMedia.originalName
                  }
                />
              )}

              {isVideo(
                previewMedia,
              ) && (
                <video
                  src={getMediaUrl(
                    previewMedia.storagePath,
                  )}
                  controls
                  autoPlay
                  playsInline
                />
              )}

              {isAudio(
                previewMedia,
              ) && (
                <div className="media-audio-player">
                  <div className="media-audio-large-icon">
                    <Music size={44} />
                  </div>

                  <h3
                    title={
                      previewMedia.originalName
                    }
                  >
                    {
                      previewMedia.originalName
                    }
                  </h3>

                  <audio
                    src={getMediaUrl(
                      previewMedia.storagePath,
                    )}
                    controls
                    autoPlay
                  />
                </div>
              )}
            </div>

            {renderMetadata(
              previewMedia,
            )}
          </div>
        </div>
      )}
    </div>
  );
}