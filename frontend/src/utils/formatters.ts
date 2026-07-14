import { ethers } from "ethers";

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function formatEther(wei: string | bigint): string {
  try {
    const value = ethers.formatEther(wei.toString());
    const num = parseFloat(value);
    if (num === 0) return "0";
    if (num < 0.001) return "< 0.001";
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(4).replace(/\.?0+$/, "");
  } catch {
    return "0";
  }
}

export function formatVITA(amount: string | bigint): string {
  try {
    const value = ethers.formatEther(amount.toString());
    const num = parseFloat(value);
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  } catch {
    return "0";
  }
}

export function formatPercentage(part: string, total: string): string {
  const p = parseFloat(part);
  const t = parseFloat(total);
  if (t === 0) return "0%";
  return `${((p / t) * 100).toFixed(1)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatTimeRemaining(deadline: string): string {
  const now = Date.now();
  const end = new Date(deadline).getTime();
  const diff = end - now;

  if (diff <= 0) return "Ended";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d ${hours}h remaining`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${mins}m remaining`;
  return `${mins}m remaining`;
}

export function progressPercent(raised: string, goal: string): number {
  const r = parseFloat(raised);
  const g = parseFloat(goal);
  if (g === 0) return 0;
  return Math.min(100, Math.round((r / g) * 100));
}

export function votePercent(votes: string, total: string): number {
  const v = parseFloat(votes);
  const t = parseFloat(total);
  if (t === 0) return 0;
  return Math.round((v / t) * 100);
}
