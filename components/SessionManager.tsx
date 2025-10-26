// ============================================================================
// Session Manager Component
// ============================================================================
/**
 * Manages session inactivity and auto-logout across the entire app
 *
 * Features:
 * - 1-minute inactivity detection
 * - 20-second warning before auto-logout
 * - Global 20-minute (or 5-minute for SSO) hard limit
 * - Tracks user activity (mouse, keyboard, touch)
 * - Shows warning popup
 * - Auto-logout on inactivity or global timeout
 */
// ============================================================================

'use client';

import { useSession, signOut } from 'next-auth/react';
import { useCallback } from 'react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import SessionWarningPopup from './SessionWarningPopup';

interface SessionManagerProps {
  children: React.ReactNode;
}

export default function SessionManager({ children }: SessionManagerProps) {
  const { data: session, status } = useSession();

  // ============================================================================
  // Configuration
  // ============================================================================

  // 1 minute = 60 seconds
  const INACTIVITY_TIMEOUT = 60; // seconds

  // Show warning 20 seconds before timeout
  const WARNING_DURATION = 20; // seconds

  // ============================================================================
  // Callbacks
  // ============================================================================

  const handleInactivityWarning = useCallback(() => {
    console.log('⚠️ Inactivity warning triggered');
    // Warning popup will show automatically via hook
  }, []);

  const handleSessionExpired = useCallback(async () => {
    console.log('❌ Session expired - logging out');
    await signOut({
      callbackUrl: '/login',
      redirect: true,
    });
  }, []);

  // ============================================================================
  // Inactivity Timer Hook
  // ============================================================================

  const {
    showWarning,
    warningTimeLeft,
    globalTimeLeft,
    resetInactivityTimer,
    closeWarning,
  } = useInactivityTimer({
    inactivityTimeout: INACTIVITY_TIMEOUT,
    warningDuration: WARNING_DURATION,
    onInactivityWarning: handleInactivityWarning,
    onSessionExpired: handleSessionExpired,
    enabled: status === 'authenticated', // Only enable when logged in
  });

  // ============================================================================
  // Continue Session Handler
  // ============================================================================

  const handleContinue = useCallback(() => {
    console.log('✅ User clicked Continue - resetting inactivity timer');
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <>
      {children}

      {/* Show warning popup only when authenticated */}
      {status === 'authenticated' && (
        <SessionWarningPopup
          show={showWarning}
          warningTimeLeft={warningTimeLeft}
          globalTimeLeft={globalTimeLeft}
          onContinue={handleContinue}
          onClose={closeWarning}
        />
      )}
    </>
  );
}
