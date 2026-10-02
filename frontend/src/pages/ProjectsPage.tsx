import { useCallback, useEffect, useState } from 'react';
import {
  Plus,
  Search,
  FolderOpen,
  Pencil,
  Trash2,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Archive,
  CheckCircle2,
  Clock,
} from 'lucide-react';

import './ProjectsPage.css';

type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

interface ProjectForm {
  name: string;
  description: string;
  status: ProjectStatus;
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5002').replace(/\/$/, '');

const EMPTY_FORM: ProjectForm = {
  name: '',
  description: '',
  status: 'DRAFT',
};

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error || result?.message || `Request failed with status ${response.status}`);
  }

  if (result?.success === false) {
    throw new Error(result.error || result.message || 'Request failed');
  }

  return result as T;
}

/*function unwrapProject(result: any): Project {
  return result?.data?.project ?? result?.project ?? result?.data ?? result;
}*/

function unwrapProjects(result: any): Project[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.projects)) return result.projects;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.projects)) return result.data.projects;

  return [];
}

function formatDate(date: string): string {
  if (!date) return '—';

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getStatusLabel(status: ProjectStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'Draft';
  }
}

function getStatusIcon(status: ProjectStatus) {
  switch (status) {
    case 'ACTIVE':
      return <CheckCircle2 size={14} />;
    case 'ARCHIVED':
      return <Archive size={14} />;
    default:
      return <Clock size={14} />;
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await apiRequest<any>('/api/projects');
      setProjects(unwrapProjects(result));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load projects.',);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const filteredProjects = projects.filter((project) => {
    const query = search.trim().toLowerCase();

    return (
      project.name.toLowerCase().includes(query) ||
      (project.description ?? '').toLowerCase().includes(query)
    );
  });

  function openCreateModal() {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(project: Project) {
    setEditingProject(project);

    setForm({
      name: project.name,
      description: project.description ?? '',
      status: project.status,
    });

    setFormError('');
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      setFormError('Project name is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      name,
      description: form.description.trim() || null,
      ...(editingProject ? { status: form.status } : {}),
    };

    try {
      if (editingProject) {
        await apiRequest(`/api/projects/${editingProject.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          },
        );
      } else {
        await apiRequest('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setModalOpen(false);
      setEditingProject(null);
      setForm(EMPTY_FORM);

      await loadProjects();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(project: Project) {
    const confirmed = window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);

    if (!confirmed) return;

    setDeletingId(project.id);
    setError('');

    try {
      await apiRequest(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      setProjects((current) =>
        current.filter((item) => item.id !== project.id),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete project.',);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <span className="projects-eyebrow">WORKSPACE</span>
          <h1>Projects</h1>
          <p>Manage your creative projects and their content.</p>
        </div>

        <button
          type="button"
          className="projects-primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          New project
        </button>
      </div>

      <div className="projects-toolbar">
        <div className="projects-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search && (
            <button
              type="button"
              className="projects-clear-search"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="projects-refresh-button"
          onClick={() => void loadProjects()}
          disabled={loading}
          aria-label="Refresh projects"
          title="Refresh"
        >
          <RefreshCw size={17} className={loading ? 'projects-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="projects-error-banner">
          <AlertCircle size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadProjects()}
            className="projects-error-retry"
          >
            Retry
          </button>
        </div>
      )}

      <div className="projects-section-heading">
        <h2>All projects</h2>
        <span className="projects-count">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
      </div>

      {loading ? (
        <div className="projects-loading">
          <Loader2 size={28} className="projects-spin" />
          <span>Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="projects-empty">
          <div className="projects-empty-icon">
            <FolderOpen size={30} />
          </div>

          <h3>{search ? 'No projects found' : 'No projects yet'}</h3>

          <p>
            {search
              ? 'Try a different search term.'
              : 'Create your first project to start organizing your content.'}
          </p>

          {!search && (
            <button
              type="button"
              className="projects-primary-button"
              onClick={openCreateModal}
            >
              <Plus size={18} />
              Create project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <article className="project-card" key={project.id}>
              <div className="project-card-top">
                <div className="project-card-icon">
                  <FolderOpen size={22} />
                </div>

                <div className={`project-status project-status-${project.status.toLowerCase()}`}>
                  {getStatusIcon(project.status)}
                  {getStatusLabel(project.status)}
                </div>
              </div>

              <div className="project-card-content">
                <h3 title={project.name}>{project.name}</h3>

                <p className="project-description">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              <div className="project-card-footer">
                <span className="project-created">
                  Created {formatDate(project.createdAt)}
                </span>

                <div className="project-card-actions">
                  <button
                    type="button"
                    className="project-action-button"
                    onClick={() => openEditModal(project)}
                    title="Edit project"
                    aria-label={`Edit ${project.name}`}
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    className="project-action-button project-delete-button"
                    onClick={() => void handleDelete(project)}
                    disabled={deletingId === project.id}
                    title="Delete project"
                    aria-label={`Delete ${project.name}`}
                  >
                    {deletingId === project.id ? (
                      <Loader2 size={16} className="projects-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div
          className="projects-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            className="projects-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="projects-modal-title"
          >
            <div className="projects-modal-header">
              <div>
                <h2 id="projects-modal-title">
                  {editingProject ? 'Edit project' : 'Create project'}
                </h2>
                <p>
                  {editingProject
                    ? 'Update your project details.'
                    : 'Add a new project to your workspace.'}
                </p>
              </div>

              <button
                type="button"
                className="projects-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="projects-form-group">
                <label htmlFor="project-name">
                  Project name <span>*</span>
                </label>

                <input
                  id="project-name"
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Enter project name"
                  maxLength={120}
                  required
                  autoFocus
                />
              </div>

              <div className="projects-form-group">
                <label htmlFor="project-description">Description</label>

                <textarea
                  id="project-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe your project..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              {editingProject && (
                <div className="projects-form-group">
                  <label htmlFor="project-status">Status</label>

                  <select
                    id="project-status"
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as ProjectStatus,
                      }))
                    }
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
              )}

              {formError && (
                <div className="projects-form-error">
                  <AlertCircle size={16} />
                  {formError}
                </div>
              )}

              <div className="projects-modal-actions">
                <button
                  type="button"
                  className="projects-secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="projects-primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={17} className="projects-spin" />
                      Saving...
                    </>
                  ) : editingProject ? (
                    'Save changes'
                  ) : (
                    'Create project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}