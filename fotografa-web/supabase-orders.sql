-- Órdenes de compra (Webpay) y ítems (fotos compradas)
-- Ejecutar en Supabase → SQL Editor

-- 1. Tabla orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email TEXT,
  guest_name TEXT,
  total_clp INTEGER NOT NULL CHECK (total_clp >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  webpay_token TEXT,
  buy_order TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

COMMENT ON COLUMN public.orders.guest_email IS 'Email del comprador si compró como invitado';
COMMENT ON COLUMN public.orders.guest_name IS 'Nombre del comprador si compró como invitado';
COMMENT ON COLUMN public.orders.buy_order IS 'Orden de compra enviada a Webpay (única, máx 26 caracteres)';

-- 2. Tabla order_items (una fila por foto comprada)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  foto_id UUID NOT NULL,
  public_id TEXT NOT NULL,
  precio INTEGER NOT NULL CHECK (precio >= 0),
  evento_nombre TEXT NOT NULL,
  subevento_nombre TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 3. RLS (opcional: solo admin puede leer órdenes; el API usa service role)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access orders" ON public.orders
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access order_items" ON public.order_items
  FOR ALL USING (true) WITH CHECK (true);
