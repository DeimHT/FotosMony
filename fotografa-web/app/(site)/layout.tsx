import Header from "FotosMony/components/ui/Header";
import Footer from "FotosMony/components/ui/Footer";
import { CartProvider } from "FotosMony/components/context/CartContext";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <Header />
      {children}
      <Footer />
    </CartProvider>
  );
}
