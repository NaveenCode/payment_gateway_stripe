// ============================================================================
// Inactivity Timer Hook
// ============================================================================
/**
 * Custom hook to detect user inactivity and show warning before auto-logout
 *
 * Features:
 * - Tracks user activity (mouse, keyboard, touch)
 * - Shows warning popup 20 seconds before 1-minute inactivity timeout
 * - Allows user to continue session or logout
 * - Respects global 20-minute hard limit
 * - Works with both SSO (5 min) and Credentials (20 min) sessions
 */
// ============================================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface InactivityTimerConfig {
  inactivityTimeout: number; // Time until warning (in seconds)
  warningDuration: number; // How long to show warning (in seconds)
  onInactivityWarning: () => void; // Called when warning should show
  onSessionExpired: () => void; // Called when session expires
  enabled: boolean; // Enable/disable the timer
}

interface InactivityTimerReturn {
  showWarning: boolean;
  warningTimeLeft: number;
  globalTimeLeft: number;
  resetInactivityTimer: () => void;
  closeWarning: () => void;
}

export function useInactivityTimer(
  config: InactivityTimerConfig
): InactivityTimerReturn {
  const { data: session } = useSession();

  const [showWarning, setShowWarning] = useState(false);
  const [warningTimeLeft, setWarningTimeLeft] = useState(config.warningDuration);
  const [globalTimeLeft, setGlobalTimeLeft] = useState(0);

  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const globalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // ============================================================================
  // Calculate Global Session Time Left
  // ============================================================================
  useEffect(() => {
    if (!session?.expires || !config.enabled) return;

    const updateGlobalTimer = () => {
      const expiresAt = new Date(session.expires).getTime();
      const now = Date.now();
      const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));

      setGlobalTimeLeft(timeLeft);

      // Auto logout when global session expires
      if (timeLeft <= 0) {
        console.log('⏰ Global session expired - auto logout');
        config.onSessionExpired();
      }
    };

    // Update immediately
    updateGlobalTimer();

    // Update every second
    globalTimerRef.current = setInterval(updateGlobalTimer, 1000);

    return () => {
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
    };
  }, [session?.expires, config.enabled, config.onSessionExpired]);

  // ============================================================================
  // Reset Inactivity Timer
  // ============================================================================
  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
    setWarningTimeLeft(config.warningDuration);

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearInterval(warningTimerRef.current);
    }

    if (!config.enabled) return;

    // Calculate when to show warning (20 seconds before timeout)
    const warningTime = (config.inactivityTimeout - config.warningDuration) * 1000;

    // Set timer to show warning
    inactivityTimerRef.current = setTimeout(() => {
      console.log('⚠️ User inactive - showing warning');
      setShowWarning(true);
      config.onInactivityWarning();

      // Start countdown for warning
      let timeLeft = config.warningDuration;
      setWarningTimeLeft(timeLeft);

      warningTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        setWarningTimeLeft(timeLeft);

        if (timeLeft <= 0) {
          console.log('❌ Inactivity timeout - logging out');
          config.onSessionExpired();
          if (warningTimerRef.current) {
            clearInterval(warningTimerRef.current);
          }
        }
      }, 1000);
    }, warningTime);
  }, [config]);

  // ============================================================================
  // Close Warning (but keep timer running)
  // ============================================================================
  const closeWarning = useCallback(() => {
    setShowWarning(false);
    // Timer continues in background - will logout when time runs out
  }, []);

  // ============================================================================
  // Track User Activity
  // ============================================================================
  useEffect(() => {
    if (!config.enabled) return;

    const activityEvents = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      // Only reset if more than 1 second has passed (avoid excessive resets)
      if (timeSinceLastActivity > 1000) {
        resetInactivityTimer();
      }
    };

    // Add event listeners
    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start initial timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });

      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearInterval(warningTimerRef.current);
      }
      if (globalTimerRef.current) {
        clearInterval(globalTimerRef.current);
      }
    };
  }, [config.enabled, resetInactivityTimer]);

  return {
    showWarning,
    warningTimeLeft,
    globalTimeLeft,
    resetInactivityTimer,
    closeWarning,
  };
}
