import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { localDateString } from '@/lib/dates';

const STORAGE_KEY = 'habit-reminders-enabled';
const PERMISSION_ASKED_KEY = 'notification-permission-asked';
const ENGAGEMENT_KEY = 'notification-engagement';
const LAST_NOTIFIED_KEY = 'last-notification-date';

// Motivational messages pool
const MESSAGES_20 = [
  'Hora de bater suas metas do dia 🚀',
  'Falta pouco! Complete seus hábitos de hoje 💪',
  'Disciplina é liberdade. Bora fechar o dia! 🔥',
  'Seus hábitos constroem seu futuro. Não pare agora! ⚡',
  'Cada dia conta. Termine o que começou! 🎯',
];

const MESSAGES_22 = [
  'Última chance! Seus hábitos ainda estão pendentes ⏰',
  'O dia ainda não acabou. Finalize suas metas! 🌙',
  'Não quebre a sequência! Complete antes de dormir 💎',
  'Faltam apenas alguns hábitos. Você consegue! 🏆',
  'Consistência separa os bons dos grandes. Feche o dia! 👑',
];

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getRemindersEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'false';
}

export function setRemindersEnabled(enabled: boolean) {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

export function getNotificationEngagement(): { sent: number; clicked: number } {
  try {
    return JSON.parse(localStorage.getItem(ENGAGEMENT_KEY) || '{"sent":0,"clicked":0}');
  } catch {
    return { sent: 0, clicked: 0 };
  }
}

function trackSent() {
  const stats = getNotificationEngagement();
  stats.sent++;
  localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(stats));
}

function trackClicked() {
  const stats = getNotificationEngagement();
  stats.clicked++;
  localStorage.setItem(ENGAGEMENT_KEY, JSON.stringify(stats));
}

async function getIncompleteCount(userId: string): Promise<{ total: number; incomplete: number }> {
  const today = localDateString();

  const [{ data: habits }, { data: completions }] = await Promise.all([
    supabase.from('habits').select('id'),
    supabase.from('habit_completions').select('habit_id').eq('completed_date', today),
  ]);

  if (!habits || habits.length === 0) return { total: 0, incomplete: 0 };

  const completedIds = new Set((completions ?? []).map(c => c.habit_id));
  const incomplete = habits.filter(h => !completedIds.has(h.id)).length;
  return { total: habits.length, incomplete };
}

function showNotification(message: string, incomplete: number, total: number) {
  if (Notification.permission !== 'granted') return;

  const completed = total - incomplete;
  const body = `${message}\n${completed}/${total} completos — faltam ${incomplete}`;

  const notification = new Notification('Painel de Controle Pessoal', {
    body,
    icon: '/favicon.ico',
    tag: 'habit-reminder',
  } as NotificationOptions);

  trackSent();

  notification.onclick = () => {
    trackClicked();
    window.focus();
    notification.close();
  };
}

export function useNotifications() {
  const { user } = useAuth();
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const scheduleReminder = useCallback((hour: number, messages: string[]) => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, 0, 0, 0);

    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }

    const ms = target.getTime() - now.getTime();

    const timer = setTimeout(async () => {
      if (!getRemindersEnabled() || !user) {
        // Reschedule for tomorrow
        scheduleReminder(hour, messages);
        return;
      }

      const { total, incomplete } = await getIncompleteCount(user.id);
      if (incomplete > 0) {
        showNotification(pickRandom(messages), incomplete, total);
      }

      scheduleReminder(hour, messages);
    }, ms);

    timersRef.current.push(timer);
  }, [user]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    if (!user) return;
    requestPermission();

    clearTimers();
    scheduleReminder(20, MESSAGES_20);
    scheduleReminder(22, MESSAGES_22);

    return clearTimers;
  }, [user, requestPermission, scheduleReminder, clearTimers]);
}
