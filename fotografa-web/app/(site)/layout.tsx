import SiteHeader from "FotosMony/components/ui/SiteHeader";
import Footer from "FotosMony/components/ui/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <Footer />
    </>
  );
}
