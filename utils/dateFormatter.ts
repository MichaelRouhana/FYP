// utils/dateFormatter.ts
// Utility functions for formatting dates and times

/**
 * Format a timestamp for display in the community list
 * - Show time if today (e.g., "3:45 PM")
 * - Show "Yesterday" if yesterday
 * - Show weekday if this week (e.g., "Monday")
 * - Show full date if older (e.g., "12/25/2024")
 */
export function formatMessageTimestamp(dateString: string | null | undefined): string {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);
    const now = new Date();
    
    // Reset time to midnight for date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Calculate difference in days
    const diffTime = today.getTime() - messageDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time
      return formatTime(date);
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show weekday
      return formatWeekday(date);
    } else {
      // Older - show full date
      return formatFullDate(date);
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return '';
  }
}

/**
 * Format time as "HH:MM AM/PM"
 */
function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format weekday name (e.g., "Monday", "Tuesday")
 */
function formatWeekday(date: Date): string {
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weekdays[date.getDay()];
}

/**
 * Format full date as "MM/DD/YYYY"
 */
function formatFullDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

