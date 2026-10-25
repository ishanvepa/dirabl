export function journalDay(date = new Date(), slash = false) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  return `${weekday}${slash ? '  /  ' : ', '}${day}`.toUpperCase();
}
export function journalTimestamp(value: string | Date) {
  const date = new Date(value);
  return `${journalDay(date)}  /  ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
export function shortDate(value: string) {
  return new Date(value)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    .toUpperCase();
}
export function friendlyTimestamp(value: string) {
  const date = new Date(value),
    today = new Date();
  const label =
    date.toDateString() === today.toDateString()
      ? 'Today'
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${label} · ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}
