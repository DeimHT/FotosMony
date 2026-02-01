import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "FotosMony/components/context/CartContext";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://fotosmony.cl";
const baseUrl = SITE_URL.startsWith("http") ? SITE_URL : `https://${SITE_URL}`;

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "FotosMony | Fotografía Profesional Región de los Lagos, Chile",
    template: "%s | FotosMony",
  },
  description:
    "Fotos Mony: fotografía profesional en la Región de los Lagos. Sesiones fotográficas, bodas, retratos y venta de fotos digitales. Compra tus fotos sin marca de agua.",
  keywords: [
    "fotos mony",
    "FotosMony",
    "fotografía región de los lagos",
    "fotógrafo Chile",
    "sesiones fotográficas",
    "bodas fotografía",
    "fotos digitales",
  ],
  authors: [{ name: "FotosMony" }],
  creator: "FotosMony",
  openGraph: {
    type: "website",
    locale: "es_CL",
    url: baseUrl,
    siteName: "FotosMony",
    title: "FotosMony | Fotografía Profesional Región de los Lagos",
    description: "Fotografía profesional en la Región de los Lagos. Sesiones, bodas, retratos y venta de fotos digitales.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FotosMony | Fotografía Región de los Lagos",
    description: "Fotografía profesional. Sesiones, bodas y venta de fotos digitales.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: "/logo.ico",
  },
  alternates: {
    canonical: baseUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-slate-50 text-slate-900`}>
        <CartProvider>
          {children}
        </CartProvider>
        <Analytics />
      </body>
    </html>
  );
}
