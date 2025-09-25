// Format time in seconds to MM:SS format
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format date to relative time (e.g., "2 hours ago")
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSecs < 60) {
    return 'agora';
  } else if (diffMins < 60) {
    return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
  } else if (diffHours < 24) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  } else {
    return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
  }
};

// Format date to full date string
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};