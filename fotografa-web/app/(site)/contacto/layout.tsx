import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Contacta a FotosMony para sesiones fotográficas, bodas y eventos en la Región de los Lagos. WhatsApp, correo y formulario de contacto.",
  openGraph: {
    title: "Contacto | FotosMony",
    description: "Escríbenos para cotizar o reservar tu sesión fotográfica.",
  },
};

export default function ContactoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
