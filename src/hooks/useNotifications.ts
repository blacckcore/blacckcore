import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';

const STORAGE_KEY = 'habit-reminders-enabled';
const PERMISSION_ASKED_KEY = 'notification-permission-asked';

export function getRemindersEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false'; // default true
}

export function setRemindersEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

async function checkIncompleteHabits(userId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase.from('habits').select('id'),
    supabase
      .from('habit_completions')
      .select('habit_id')
      .eq('completed_date', today),
  ]);

  if (!habits || habits.length === 0) return false;

  const completedIds = new Set((completions ?? []).map(c => c.habit_id));
  return habits.some(h => !completedIds.has(h.id));
}

function showNotification() {
  if (Notification.permission === 'granted') {
    new Notification('Painel de Controle Pessoal', {
      body: 'Hora de bater suas metas do dia 🚀',
      icon: '/favicon.ico',
    });
  }
}

export function useNotifications() {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const alreadyAsked = localStorage.getItem(PERMISSION_ASKED_KEY);
      if (!alreadyAsked) {
        localStorage.setItem(PERMISSION_ASKED_KEY, 'true');
        await Notification.requestPermission();
      }
    }
  }, []);

  const scheduleCheck = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const now = new Date();
    const target = new Date();
    target.setHours(20, 0, 0, 0);

    if (now >= target) {
      // Already past 20:00 today — schedule for tomorrow
      target.setDate(target.getDate() + 1);
    }

    const ms = target.getTime() - now.getTime();

    timerRef.current = setTimeout(async () => {
      if (!getRemindersEnabled()) {
        scheduleCheck(); // reschedule for tomorrow
        return;
      }
      if (user) {
        const hasIncomplete = await checkIncompleteHabits(user.id);
        if (hasIncomplete) {
          showNotification();
        }
      }
      scheduleCheck(); // reschedule for next day
    }, ms);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    requestPermission();
    scheduleCheck();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, requestPermission, scheduleCheck]);
}
