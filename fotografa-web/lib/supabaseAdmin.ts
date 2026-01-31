import { createClient } from "@supabase/supabase-js";

// Usa tu URL de Supabase y la clave del "Service Role" (secreta).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Aquí usarás la clave de servicio (no la pública)
);
