import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Images,
  FolderKanban,
  BrainCircuit,
  Film,
  ClipboardCheck,
  Send,
  Settings,
  CheckCircle2,
  AlertCircle,
  LoaderCircle
} from "lucide-react";

import { getHealth } from "./services/api";
import type { HealthResponse } from "./services/api";

import "./App.css";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Projects", icon: FolderKanban },
  { label: "Media Library", icon: Images },
  { label: "AI Content Studio", icon: BrainCircuit },
  { label: "Video Editor", icon: Film },
  { label: "Approvals", icon: ClipboardCheck },
  { label: "Publications", icon: Send }
];

export default function App() {
  const [health, setHealth] =
    useState<HealthResponse | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Film size={24} />
          </div>
          <div>
            <strong>Social Studio</strong>
            <span>AI Content Creator</span>
          </div>
        </div>

        <nav>
          <span className="nav-heading">WORKSPACE</span>

          {menuItems.map(({ label, icon: Icon }) => (
            <button
              className={`nav-item ${
                label === "Dashboard" ? "active" : ""
              }`}
              key={label}
              type="button"
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" type="button">
            <Settings size={19} />
            <span>Settings</span>
          </button>
          <span className="local-label">
            Local development
          </span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">WORKSPACE</span>
            <h1>Dashboard</h1>
          </div>

          <div className="language-badge">
            ES / EN
          </div>
        </header>

        <section className="welcome-section">
          <span className="eyebrow">YOUR CREATIVE WORKSPACE</span>
          <h2>Turn your media into social content.</h2>
          <p>
            Create videos, prepare captions, and manage
            your social media content with AI.
          </p>
        </section>

        <section className="status-card">
          <div>
            <span className="eyebrow">BACKEND STATUS</span>
            <h3>
              {health
                ? "API connected"
                : error
                  ? "Connection failed"
                  : "Connecting..."}
            </h3>
            <p>
              {health?.message ??
                error ??
                "Checking the local backend..."}
            </p>
          </div>

          {health ? (
            <CheckCircle2 className="status-success" />
          ) : error ? (
            <AlertCircle className="status-error" />
          ) : (
            <LoaderCircle className="loading-icon" />
          )}
        </section>

        <section className="section-heading">
          <div>
            <h2>Content workspace</h2>
            <p>Your creative tools will live here.</p>
          </div>
        </section>

        <section className="feature-grid">
          {menuItems.slice(1).map(({ label, icon: Icon }) => (
            <article className="feature-card" key={label}>
              <div className="feature-icon">
                <Icon size={22} />
              </div>
              <h3>{label}</h3>
              <p>
                This module will be implemented in a
                future development phase.
              </p>
              <span className="coming-soon">
                Planned
              </span>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}