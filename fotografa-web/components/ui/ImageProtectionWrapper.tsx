"use client";

/**
 * Envuelve imágenes de galería para dificultar guardar/descargar:
 * - Bloquea menú contextual (clic derecho → "Guardar imagen como")
 * - Bloquea arrastrar la imagen
 * - Evita selección de texto/imagen (select-none)
 * No evita capturas de pantalla (el navegador no lo permite).
 */
export function ImageProtectionWrapper({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`select-none ${className ?? ""}`}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      {...props}
    >
      {children}
    </div>
  );
}
