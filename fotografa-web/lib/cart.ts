/** Item en el carrito: una foto a comprar (evento o subevento). */
export type CartItem = {
  fotoId: string;
  publicId: string;
  precio: number;
  eventoNombre: string;
  eventSlug: string;
  subEventoNombre?: string;
  subEventSlug?: string;
  /** Nombre original del archivo (ej. DSC_9577.JPG) para mostrar en WhatsApp */
  nombreArchivo?: string;
};

export const CART_STORAGE_KEY = "fotosmony_cart";

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartItem =>
        typeof x?.fotoId === "string" &&
        typeof x?.publicId === "string" &&
        typeof x?.precio === "number" &&
        typeof x?.eventoNombre === "string" &&
        typeof x?.eventSlug === "string"
    );
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}
