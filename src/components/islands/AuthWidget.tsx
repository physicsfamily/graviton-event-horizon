import { useState } from 'react';

interface AuthWidgetProps {
  appUrl: string;
}

export default function AuthWidget({ appUrl }: AuthWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(isLogin ? 'Login' : 'Sign up', { email, password });
    setIsModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-pink)] px-4 py-2 text-sm font-semibold text-[var(--color-void-black)] transition-all hover:shadow-lg hover:shadow-[var(--color-neon-blue)]/25"
      >
        Get Started
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-[var(--color-void-black)]/80 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-void-light)] bg-[var(--color-void-dark)] p-8 shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {isLogin 
                  ? 'Sign in to access your simulations' 
                  : 'Start your journey with Entropy Zero'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-void-light)] bg-[var(--color-void-gray)] px-4 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-neon-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-blue)]"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-void-light)] bg-[var(--color-void-gray)] px-4 py-2 text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-neon-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-neon-blue)]"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-[var(--color-neon-blue)] to-[var(--color-neon-pink)] px-4 py-3 text-sm font-semibold text-[var(--color-void-black)] transition-all hover:shadow-lg hover:shadow-[var(--color-neon-blue)]/25"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-[var(--color-neon-blue)] hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
