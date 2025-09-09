export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiGet<T = unknown>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<T>;
}
