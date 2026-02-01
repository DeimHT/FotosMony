import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portafolio",
  description:
    "Portafolio de FotosMony. Galería de trabajos de fotografía profesional: bodas, retratos y eventos en la Región de los Lagos.",
  openGraph: {
    title: "Portafolio | FotosMony Fotografía",
    description: "Conoce nuestro trabajo. Galerías de fotografía profesional.",
  },
};

export default function PortafolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
