'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { signupSchema, formatZodErrors, calculateAge, type SignupFormData } from '@/lib/utils/validation';
import LocationAutocomplete from '@/components/ui/LocationAutocomplete';
import { z } from 'zod';

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();
  
  const [formData, setFormData] = useState<SignupFormData>({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    date_of_birth: '',
    location: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error on change
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setServerError(null);
  };

  const validateForm = (): boolean => {
    try {
      signupSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors(formatZodErrors(error));
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    
    if (!validateForm()) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.full_name.trim(),
            email: formData.email.toLowerCase().trim(),
            password: formData.password,
            date_of_birth: formData.date_of_birth,
            location: formData.location?.trim() || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setServerError(data.error || 'Something went wrong. Please try again.');
          return;
        }

        // Success - now sign in the user
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
        });

        if (signInError) {
          // Account was created but sign-in failed - redirect to login
          router.push('/login?message=Account created! Please sign in.');
          return;
        }

        // Fully authenticated - redirect to session page
        router.push('/session');
        router.refresh();
      } catch (error) {
        setServerError('Network error. Please check your connection and try again.');
      }
    });
  };

  // Calculate age for display
  const userAge = formData.date_of_birth ? calculateAge(formData.date_of_birth) : null;

  return (
    <div className="min-h-screen bg-[var(--cream)] flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <span 
              className="text-2xl font-semibold text-[var(--oxford-blue)]"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Alaris
            </span>
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 
              className="text-3xl font-semibold text-[var(--oxford-blue)] mb-2"
              style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
            >
              Begin your first tutorial
            </h1>
            <p className="text-[var(--slate)]">
              Create your account to start training how you think, not just what you know.
            </p>
          </div>

          {/* Server Error */}
          {serverError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="label">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                autoComplete="name"
                value={formData.full_name}
                onChange={handleChange}
                className={`input ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Jane Doe"
              />
              {errors.full_name && (
                <p className="error-text">{errors.full_name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="jane@example.com"
              />
              {errors.email && (
                <p className="error-text">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input pr-12 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--silver)] hover:text-[var(--slate)] transition"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password ? (
                <p className="error-text">{errors.password}</p>
              ) : (
                <p className="mt-1 text-xs text-[var(--silver)]">
                  8+ characters with uppercase, lowercase, and a number
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm_password" className="label">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`input pr-12 ${errors.confirm_password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--silver)] hover:text-[var(--slate)] transition"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="error-text">{errors.confirm_password}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="label">
                Date of Birth
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`input ${errors.date_of_birth ? 'input-error' : ''}`}
              />
              {errors.date_of_birth ? (
                <p className="error-text">{errors.date_of_birth}</p>
              ) : userAge !== null && userAge >= 13 ? (
                <p className="mt-1 text-xs text-[var(--success)]">
                  Age: {userAge} years old
                </p>
              ) : (
                <p className="mt-1 text-xs text-[var(--silver)]">
                  You must be at least 13 years old
                </p>
              )}
            </div>

            {/* Location (Optional) */}
            <div>
              <label htmlFor="location" className="label">
                Location <span className="text-[var(--silver)] font-normal">(optional)</span>
              </label>
              <LocationAutocomplete
                value={formData.location || ''}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, location: value }));
                  if (errors.location) {
                    setErrors(prev => {
                      const next = { ...prev };
                      delete next.location;
                      return next;
                    });
                  }
                }}
                placeholder="London, UK"
                className={`input ${errors.location ? 'input-error' : ''}`}
                error={!!errors.location}
              />
              {errors.location && (
                <p className="error-text">{errors.location}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full mt-8"
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="spinner" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-8 text-center text-[var(--slate)]">
            Already have an account?{' '}
            <Link 
              href="/login" 
              className="text-[var(--oxford-blue)] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel - Decorative (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-[var(--oxford-blue)] items-center justify-center p-12">
        <div className="max-w-md text-center">
          <p 
            className="text-2xl text-white/90 font-medium leading-relaxed mb-6"
            style={{ fontFamily: 'var(--font-crimson), Georgia, serif' }}
          >
            Join curious minds training their thinking through Oxford-style tutorials.
          </p>
          
          <div className="mt-12 grid grid-cols-3 gap-6 text-white/70">
            <div>
              <div className="text-3xl font-semibold text-white mb-1">9</div>
              <div className="text-sm">Cognitive Skills</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-white mb-1">30</div>
              <div className="text-sm">Min Sessions</div>
            </div>
            <div>
              <div className="text-3xl font-semibold text-white mb-1">∞</div>
              <div className="text-sm">Growth</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
