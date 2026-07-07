import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { Video, ArrowRight, AlertCircle, Users, Monitor, Link2, Hash } from 'lucide-react';
import { Spinner } from '@/shared/components/Loading';
import { API_URL } from '@/shared/constants';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomePage() {
  const { user, accessToken } = useAuthStore();
  const [meetingCode, setMeetingCode] = useState('');
  const [title, setTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateMeeting = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ title: title || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create meeting');
      navigate(`/lobby/${data.data.meeting.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinMeeting = async (e: FormEvent) => {
    e.preventDefault();
    if (!meetingCode || isJoining) return;
    setIsJoining(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/meetings/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: meetingCode.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Meeting not found');
      navigate(`/lobby/${data.data.meeting.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting');
    } finally {
      setIsJoining(false);
    }
  };

  const firstName = user?.name.split(' ')[0] || 'there';

  const featureCards = [
    {
      icon: Video,
      label: 'Instant Video',
      desc: 'Start a meeting in one click',
      colorClass: 'home-card-blue',
    },
    {
      icon: Users,
      label: 'Team Meeting',
      desc: 'Invite multiple participants',
      colorClass: 'home-card-green',
    },
    {
      icon: Monitor,
      label: 'Screen Share',
      desc: 'Present your screen live',
      colorClass: 'home-card-amber',
    },
  ];

  return (
    <div className="home-root">
      {/* ── Greeting ── */}
      <div className="home-greeting">
        <h1 className="home-greeting-title">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="home-greeting-sub">Start or join a meeting below</p>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="home-error">
          <AlertCircle size={15} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="home-actions">
        <button
          onClick={handleCreateMeeting}
          disabled={isCreating || isJoining}
          className="home-btn-primary"
          id="new-meeting-btn"
        >
          {isCreating ? <Spinner size="sm" /> : <Video size={16} />}
          New Meeting
        </button>

        <form onSubmit={handleJoinMeeting} className="home-join-form">
          <div className="home-join-input-wrap">
            <Hash size={14} className="home-join-icon" />
            <input
              type="text"
              value={meetingCode}
              onChange={(e) => setMeetingCode(e.target.value)}
              placeholder="Enter meeting code"
              disabled={isCreating || isJoining}
              className="home-join-input"
              id="meeting-code-input"
            />
          </div>
          <button
            type="submit"
            disabled={!meetingCode || isCreating || isJoining}
            className="home-btn-secondary"
            id="join-meeting-btn"
          >
            {isJoining ? <Spinner size="sm" /> : <ArrowRight size={15} />}
            Join
          </button>
        </form>
      </div>

      {/* ── Feature Cards ── */}
      <div className="home-cards">
        {featureCards.map(({ icon: Icon, label, desc, colorClass }) => (
          <div key={label} className={`home-card ${colorClass}`}>
            <div className="home-card-icon-wrap">
              <Icon size={20} className="home-card-icon" />
            </div>
            <div className="home-card-text">
              <p className="home-card-label">{label}</p>
              <p className="home-card-desc">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Create with Topic ── */}
      <div className="home-topic-section">
        <p className="home-topic-label">Or start with a topic</p>
        <div className="home-topic-row">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekly Sync, Design Review…"
            disabled={isCreating}
            className="home-topic-input"
            id="meeting-title-input"
          />
          <button
            onClick={handleCreateMeeting}
            disabled={isCreating || isJoining || !title.trim()}
            className="home-btn-primary"
            id="start-with-topic-btn"
          >
            {isCreating ? <Spinner size="sm" /> : <Link2 size={15} />}
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
