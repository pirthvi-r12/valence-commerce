export function flashSaleEnds(now = new Date()) {
  const end = new Date(now);
  const daysAhead = (7 - end.getDay()) % 7;
  end.setDate(end.getDate() + daysAhead);
  end.setHours(23, 59, 59, 999);
  if (end.getTime() - now.getTime() < 1000) end.setDate(end.getDate() + 7);
  return end;
}

export function formatCountdown(end: Date, now = new Date()) {
  const total = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}
