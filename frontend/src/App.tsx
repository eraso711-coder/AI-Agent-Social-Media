import { useState } from 'react';

import {
  LayoutDashboard,
  FolderKanban,
  Images,
  BrainCircuit,
  Sparkles,
  Film,
  ClipboardCheck,
  Send,
  Menu,
  X,
} from 'lucide-react';

import ProjectsPage from './pages/ProjectsPage';
import MediaLibraryPage from './pages/MediaLibraryPage';
import AIAnalysisPage from './pages/AIAnalysisPage';

import "./App.css";

type Page =
  | 'dashboard'
  | 'projects'
  | 'media'
  | 'ai-analysis'
  | 'ai-content'
  | 'video-editor'
  | 'approvals'
  | 'publications';

interface NavigationItem {
  id: Page;
  label: string;
  icon: typeof LayoutDashboard;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderKanban,
  },
  {
    id: 'media',
    label: 'Media Library',
    icon: Images,
  },
  {
    id: 'ai-analysis',
    label: 'AI Media Analysis',
    icon: Sparkles,
  },
  {
    id: 'ai-content',
    label: 'AI Content Studio',
    icon: BrainCircuit,
  },
  {
    id: 'video-editor',
    label: 'Video Editor',
    icon: Film,
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: ClipboardCheck,
  },
  {
    id: 'publications',
    label: 'Publications',
    icon: Send,
  },
];

function DashboardPage({
  onNavigate,
}: {
  onNavigate: (page: Page) => void;
}) {
  const plannedModules = [
    {
      id: 'projects' as Page,
      title: 'Projects',
      description: 'Create and manage your social media content projects.',
      icon: FolderKanban,
    },
    {
      id: 'media' as Page,
      title: 'Media Library',
      description: 'Manage images, videos, and audio assets.',
      icon: Images,
    },
    {
      id: 'ai-analysis' as Page,
      title: 'AI Media Analysis',
      description: 'Understand images and videos with AI-generated summaries and keywords.',
      icon: Sparkles,
    },
    {
      id: 'ai-content' as Page,
      title: 'AI Content Studio',
      description: 'Create captions and social content with AI.',
      icon: BrainCircuit,
    },
    {
      id: 'video-editor' as Page,
      title: 'Video Editor',
      description: 'Create and edit videos for your social channels.',
      icon: Film,
    },
    {
      id: 'approvals' as Page,
      title: 'Approvals',
      description: 'Review and approve content before publishing.',
      icon: ClipboardCheck,
    },
    {
      id: 'publications' as Page,
      title: 'Publications',
      description: 'Manage and publish your approved social content.',
      icon: Send,
    },
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">WORKSPACE</span>
          <h1>Dashboard</h1>
        </div>
        <button type="button" className="language-button">ES / EN</button>
      </div>
      <div className="dashboard-hero">
        <span>YOUR CREATIVE WORKSPACE</span>
        <h2>Turn your media into social content.</h2>
        <p>
          Create videos, prepare captions, and manage your social
          media content with AI.
        </p>
      </div>
      <div className="backend-status">
        <div>
          <span className="backend-status-label">BACKEND STATUS</span>
          <strong>Connection failed</strong>
          <p>Failed to fetch</p>
        </div>
        <div className="backend-status-error">!</div>
      </div>
      <div className="content-workspace-header">
        <h2>Content workspace</h2>
        <p>Your creative tools will live here.</p>
      </div>

      <div className="dashboard-modules">
        {plannedModules.map((module) => {
          const Icon = module.icon;

          return (
            <button
              key={module.id}
              type="button"
              className="dashboard-module-card"
              onClick={() => onNavigate(module.id)}
            >
              <div className="dashboard-module-icon">
                <Icon size={21} />
              </div>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span>{module.id === 'ai-analysis' ? 'Available' : 'Planned'}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function navigateTo(page: Page) {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  }

  const currentNavigationItem = navigationItems.find(
    (item) => item.id === currentPage,
  );

  return (
    <div className="app">
      <aside
        className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''
          }`}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Film size={22} />
          </div>

          <div>
            <strong>Social Studio</strong>
            <span>AI Content Creator</span>
          </div>

          <button
            type="button"
            className="mobile-close-button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-title">WORKSPACE</div>

        <nav className="sidebar-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-navigation-item ${active ? 'active' : ''}`}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {mobileMenuOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      <main className="main-content">
        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {currentPage === 'dashboard' && (
          <DashboardPage onNavigate={navigateTo} />
        )}

        {currentPage === 'projects' && <ProjectsPage />}
        {currentPage === 'media' && <MediaLibraryPage />}
        {currentPage === 'ai-analysis' && <AIAnalysisPage />}

        {currentPage !== 'dashboard' &&
          currentPage !== 'projects' &&
          currentPage !== 'media' &&
          currentPage !== 'ai-analysis' && (
            <div className="coming-soon-page">
              <span className="dashboard-eyebrow">WORKSPACE</span>
              <h1>{currentNavigationItem?.label}</h1>
              <p>
                This module will be implemented in a
                future development phase.
              </p>
            </div>
          )}
      </main>
    </div>
  );
}

export default App;
