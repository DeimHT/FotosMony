"use client";

import { usePathname } from "next/navigation";
import Header from "FotosMony/components/ui/Header";
import HeaderAdmin from "FotosMony/components/ui/HeaderAdmin";

export default function SiteHeader() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;

  if (isAdminRoute) return <HeaderAdmin />;
  return <Header />;
}
