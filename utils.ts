export const formatRelative = (dateIso: string) => {
  const delta = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.floor(delta / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const dueLabel = (dateIso: string) => {
  const delta = new Date(dateIso).getTime() - Date.now();
  const days = Math.ceil(delta / (1000 * 60 * 60 * 24));
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days}d`;
};

