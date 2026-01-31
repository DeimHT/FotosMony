import Header from "FotosMony/components/ui/Header";
import Footer from "FotosMony/components/ui/Footer";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
