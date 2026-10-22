import { useI18n } from 'vue-i18n'

/**
 * Relative-time formatter shared across views.
 *
 * Mirrors the behavior previously inlined in DashboardHome.vue and
 * Reservations.vue: seconds -> "just now", minutes/hours/days -> pluralized
 * i18n keys, and anything older than a week falls back to a short date.
 */
export function useRelativeTime() {
  const { t, locale } = useI18n()

  return (timestamp) => {
    const time = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
    const now = Date.now()
    const diff = now - time
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return t('dashboard.time.justNow')
    if (minutes < 60) return t('dashboard.time.minutesAgo', minutes)
    if (hours < 24) return t('dashboard.time.hoursAgo', hours)
    if (days === 1) return t('dashboard.time.yesterday')
    if (days < 7) return t('dashboard.time.daysAgo', days)
    return new Date(time).toLocaleDateString(locale.value || 'es', {
      day: 'numeric',
      month: 'short'
    })
  }
}
