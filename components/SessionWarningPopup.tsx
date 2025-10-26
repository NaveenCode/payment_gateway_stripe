// ============================================================================
// Session Warning Popup Component
// ============================================================================
/**
 * Popup that appears when user is inactive for 1 minute
 *
 * Features:
 * - Shows countdown timer (20 seconds)
 * - "Continue" button - resets inactivity timer
 * - "Logout" button - logs out immediately
 * - "X" close button - hides popup but timer continues
 * - Shows global session time remaining
 * - Animated entrance
 */
// ============================================================================

'use client';

import { signOut } from 'next-auth/react';
import { X } from 'lucide-react';

interface SessionWarningPopupProps {
  show: boolean;
  warningTimeLeft: number; // Seconds until auto-logout
  globalTimeLeft: number; // Total session time left
  onContinue: () => void;
  onClose: () => void;
}

export default function SessionWarningPopup({
  show,
  warningTimeLeft,
  globalTimeLeft,
  onContinue,
  onClose,
}: SessionWarningPopupProps) {
  if (!show) return null;

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getWarningColor = (): string => {
    if (warningTimeLeft <= 5) return 'text-red-600';
    if (warningTimeLeft <= 10) return 'text-orange-600';
    return 'text-yellow-600';
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center animate-fade-in">
        {/* Popup */}
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6 animate-slide-up">
          {/* Header with Close Button */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Session Inactivity Warning
                </h2>
                <p className="text-sm text-gray-500">Are you still there?</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Message */}
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              You've been inactive for 1 minute. Your session will automatically
              log out in:
            </p>

            {/* Inactivity Countdown */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getWarningColor()} mb-2`}>
                  {warningTimeLeft}
                </div>
                <div className="text-sm text-gray-600">seconds remaining</div>
              </div>
            </div>

            {/* Global Session Time */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Total session time left:</span>
                <span className="font-semibold text-blue-600">
                  {formatTime(globalTimeLeft)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Continue Button */}
            <button
              onClick={onContinue}
              className="flex-1 py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Continue Session
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex-1 py-3 px-4 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout Now
            </button>
          </div>

          {/* Info Text */}
          <p className="text-xs text-gray-500 text-center mt-4">
            Click "Continue" to reset the inactivity timer. Your session will
            end after {formatTime(globalTimeLeft)} regardless of activity.
          </p>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
