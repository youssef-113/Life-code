import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        textAlign: 'center',
        padding: 24,
      }}
    >
      <svg width="160" height="50" viewBox="0 0 160 50" fill="none">
        <path
          className="pulse-path"
          d="M0 25h30l8-18 12 38 9-28 6 8h95"
          stroke="var(--critical-red)"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 style={{ fontSize: 26 }}>Flatline — page not found</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 360 }}>
        The page you're looking for doesn't exist, or has been moved.
      </p>
      <Link to="/">
        <Button>Back to safety</Button>
      </Link>
    </div>
  )
}
