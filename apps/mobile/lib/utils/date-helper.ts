export const formatTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}g`;
  } else if (hours > 0) {
    return `${hours}s`;
  } else {
    return "Şimdi";
  }
};
