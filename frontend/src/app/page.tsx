import Link from "next/link";

export default function Home() {
  return (
    <main className="auth-container">
      <div className="glass-card" style={{ maxWidth: '600px' }}>
        <h1>Asset Flow</h1>
        <p>Welcome to the premium asset management platform.</p>
        
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
          <Link href="/login" className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
            Sign In
          </Link>
          <Link href="/register" className="btn-primary" style={{ flex: 1 }}>
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
