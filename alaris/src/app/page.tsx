import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--cream)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--cream)]/80 backdrop-blur-md border-b border-[var(--oxford-blue)]/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-semibold text-[var(--oxford-blue)]" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
              Alaris
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/login" className="btn-ghost text-sm sm:text-base px-3 sm:px-6">
              Sign In
            </Link>
            <Link href="/signup" className="btn-primary text-sm sm:text-base px-4 sm:px-6">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold text-[var(--oxford-blue)] mb-6 animate-fade-in stagger-1"
            style={{ fontFamily: 'var(--font-crimson), Georgia, serif', lineHeight: '1.1' }}
          >
            Become a world-class thinker<br />
            through daily <span className="text-[var(--gold)]">Oxford-style</span> voice tutorials
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-[var(--slate)] max-w-2xl mx-auto mb-12 leading-relaxed animate-fade-in stagger-2 px-4">
            30-minute voice conversations that train you to argue like a lawyer, 
            explain like a scientist, and question like a philosopher.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 animate-fade-in stagger-3 w-full max-w-md mx-auto sm:max-w-none">
            <Link href="/signup" className="btn-primary text-lg px-8 py-4 text-center">
              Try Your First Tutorial
            </Link>
            <Link href="/login" className="btn-secondary text-lg px-8 py-4 text-center">
              Sign In
            </Link>
          </div>

          {/* Trust Indicator */}
          <p className="mt-8 text-sm text-[var(--silver)] animate-fade-in stagger-4">
            Try your first tutorial free • 30-minute sessions • No credit card required
          </p>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-32 grid md:grid-cols-3 gap-8">
          <div className="card p-8 animate-fade-in stagger-1">
            <div className="w-12 h-12 bg-[var(--oxford-blue)]/5 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--oxford-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--oxford-blue)] mb-2" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
              Socratic Dialogue
            </h3>
            <p className="text-[var(--slate)]">
              Your tutor doesn't lecture—they ask questions that challenge you 
              to construct your own understanding.
            </p>
          </div>

          <div className="card p-8 animate-fade-in stagger-2">
            <div className="w-12 h-12 bg-[var(--oxford-blue)]/5 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--oxford-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--oxford-blue)] mb-2" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
              Nine Cognitive Skills
            </h3>
            <p className="text-[var(--slate)]">
              Develop the skills elite thinkers master: building arguments, explaining complex 
              ideas simply, calibrating your confidence, and connecting insights across domains.
            </p>
          </div>

          <div className="card p-8 animate-fade-in stagger-3">
            <div className="w-12 h-12 bg-[var(--oxford-blue)]/5 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[var(--oxford-blue)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-[var(--oxford-blue)] mb-2" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
              Personalized Learning
            </h3>
            <p className="text-[var(--slate)]">
              Your tutor remembers you. Each session builds on the last, 
              adapting to your interests, strengths, and curiosities.
            </p>
          </div>
        </div>

        {/* Quote Section */}
        <div className="max-w-3xl mx-auto mt-32 text-center">
          <blockquote className="text-2xl md:text-3xl text-[var(--oxford-blue)] italic leading-relaxed" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
            "I cannot teach anybody anything. I can only make them think."
          </blockquote>
          <cite className="block mt-4 text-[var(--slate)] not-italic">
            — Socrates
          </cite>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--oxford-blue)]/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center md:flex-row md:justify-between gap-4 text-center md:text-left">
          <span className="text-xl font-semibold text-[var(--oxford-blue)]" style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}>
            Alaris
          </span>
          <p className="text-sm text-[var(--silver)]">
            © {new Date().getFullYear()} Alaris. Training minds.
          </p>
        </div>
      </footer>
    </div>
  );
}
