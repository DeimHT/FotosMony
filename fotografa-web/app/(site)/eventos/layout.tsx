import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Eventos y Galerías",
  description:
    "Galerías de fotos de eventos en FotosMony. Busca tu evento, revisa las fotos con marca de agua y compra las que te gusten. Entrega digital sin marca de agua.",
  openGraph: {
    title: "Galerías de eventos | FotosMony",
    description: "Revisa y compra fotos de tu evento. Galerías organizadas por evento y subevento.",
  },
};

export default function EventosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
