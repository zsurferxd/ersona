/**
 * Notification Manager for Ersona
 * Handles browser push notifications for task reminders.
 * Uses the Notification API (no Service Worker required).
 */

const NOTIFICATION_PERMISSION_KEY = 'ersona_notification_enabled';
const NOTIFIED_TASKS_KEY = 'ersona_notified_tasks';
const CHECK_INTERVAL_MS = 60 * 1000; // 60 seconds

let checkerInterval = null;

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported() {
  return 'Notification' in window;
}

/**
 * Get current notification permission status
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Check if user has opted-in to notifications
 */
export function isNotificationEnabled() {
  return localStorage.getItem(NOTIFICATION_PERMISSION_KEY) === 'true';
}

/**
 * Request notification permission from browser
 * @returns {Promise<'granted'|'denied'|'default'>}
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    console.warn('[Ersona] Notifications not supported in this browser');
    return 'unsupported';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    }
    return permission;
  } catch (err) {
    console.error('[Ersona] Failed to request notification permission:', err);
    return 'default';
  }
}

/**
 * Disable notifications (user opt-out)
 */
export function disableNotifications() {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'false');
  stopReminderChecker();
}

/**
 * Enable notifications (user opt-in, assumes permission already granted)
 */
export function enableNotifications() {
  localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
}

/**
 * Get the set of already-notified task IDs for today
 * Resets daily so users get fresh reminders each day.
 */
function getNotifiedTasks() {
  try {
    const stored = localStorage.getItem(NOTIFIED_TASKS_KEY);
    if (!stored) return { date: '', tasks: [] };
    return JSON.parse(stored);
  } catch {
    return { date: '', tasks: [] };
  }
}

function markTaskNotified(taskId) {
  const today = new Date().toISOString().split('T')[0];
  const data = getNotifiedTasks();
  
  // Reset if it's a new day
  if (data.date !== today) {
    data.date = today;
    data.tasks = [];
  }
  
  if (!data.tasks.includes(taskId)) {
    data.tasks.push(taskId);
  }
  
  localStorage.setItem(NOTIFIED_TASKS_KEY, JSON.stringify(data));
}

function isTaskAlreadyNotified(taskId) {
  const today = new Date().toISOString().split('T')[0];
  const data = getNotifiedTasks();
  
  // If stored date is not today, nothing has been notified today
  if (data.date !== today) return false;
  
  return data.tasks.includes(taskId);
}

/**
 * Send a browser notification
 */
function sendNotification(title, body, tag) {
  if (getNotificationPermission() !== 'granted') return;
  
  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: tag || 'ersona-reminder',
      requireInteraction: true,
      silent: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // Auto-close after 15 seconds
    setTimeout(() => notification.close(), 15000);
  } catch (err) {
    console.error('[Ersona] Failed to send notification:', err);
  }
}

/**
 * Check todos for active reminders and send notifications
 * @param {Array} todos - Array of todo objects with reminder_date, title, is_completed, deleted_at
 * @param {boolean} isEn - Whether the language is English
 */
function checkAndNotify(todos, isEn = true) {
  if (!isNotificationEnabled() || getNotificationPermission() !== 'granted') return;
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  
  const pendingReminders = todos.filter(todo => {
    if (!todo.reminder_date || todo.is_completed || todo.deleted_at) return false;
    if (isTaskAlreadyNotified(todo.id)) return false;
    
    try {
      const reminderDate = new Date(todo.reminder_date);
      // Notify if reminder date is today or has passed (and task is still not completed)
      return reminderDate <= todayEnd;
    } catch {
      return false;
    }
  });

  if (pendingReminders.length === 0) return;

  // If there's only 1 task, show it directly
  if (pendingReminders.length === 1) {
    const task = pendingReminders[0];
    const reminderDate = new Date(task.reminder_date);
    const isPast = reminderDate < todayStart;
    
    const title = isEn ? '🔔 Task Reminder' : '🔔 Pengingat Tugas';
    const overdue = isPast
      ? (isEn ? ' (Overdue!)' : ' (Terlambat!)')
      : '';
    
    sendNotification(
      title,
      `${task.title}${overdue}`,
      `ersona-task-${task.id}`
    );
    markTaskNotified(task.id);
  } else {
    // Multiple tasks: send a summary notification
    const overdueCount = pendingReminders.filter(t => {
      const d = new Date(t.reminder_date);
      return d < todayStart;
    }).length;

    const title = isEn
      ? `🔔 ${pendingReminders.length} Task Reminders`
      : `🔔 ${pendingReminders.length} Pengingat Tugas`;
    
    const lines = pendingReminders.slice(0, 3).map(t => `• ${t.title}`);
    if (pendingReminders.length > 3) {
      lines.push(isEn
        ? `...and ${pendingReminders.length - 3} more`
        : `...dan ${pendingReminders.length - 3} lainnya`
      );
    }
    if (overdueCount > 0) {
      lines.push(isEn
        ? `⚠️ ${overdueCount} overdue!`
        : `⚠️ ${overdueCount} terlambat!`
      );
    }

    sendNotification(title, lines.join('\n'), 'ersona-batch-reminder');
    
    // Mark all as notified
    pendingReminders.forEach(t => markTaskNotified(t.id));
  }
}

/**
 * Start the periodic reminder checker
 * @param {Function} getTodos - Function that returns the current todos array
 * @param {Function} getIsEn - Function that returns whether language is English
 */
export function startReminderChecker(getTodos, getIsEn) {
  stopReminderChecker(); // Clear any existing interval
  
  if (!isNotificationSupported() || !isNotificationEnabled()) return;
  
  // Check immediately on start
  const todos = getTodos();
  const isEn = getIsEn();
  checkAndNotify(todos, isEn);
  
  // Then check every 60 seconds
  checkerInterval = setInterval(() => {
    const currentTodos = getTodos();
    const currentIsEn = getIsEn();
    checkAndNotify(currentTodos, currentIsEn);
  }, CHECK_INTERVAL_MS);
}

/**
 * Stop the periodic reminder checker
 */
export function stopReminderChecker() {
  if (checkerInterval) {
    clearInterval(checkerInterval);
    checkerInterval = null;
  }
}

/**
 * Send a test notification to verify it's working
 */
export function sendTestNotification(isEn = true) {
  const title = isEn ? '🪐 Ersona Notifications Active' : '🪐 Notifikasi Ersona Aktif';
  const body = isEn
    ? 'You will receive reminders when tasks are due.'
    : 'Anda akan menerima pengingat saat tugas jatuh tempo.';
  sendNotification(title, body, 'ersona-test');
}
