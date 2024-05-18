import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAbsoluteUrl(path: string) {
  if (typeof window !== "undefined") return path;

  // If we're on Vercel, we need to prepend the URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}${path}`;

  // If we're running locally, we need to prepend the port
  return `http://localhost:${process.env.PORT ?? 3000}${path}`;
}
