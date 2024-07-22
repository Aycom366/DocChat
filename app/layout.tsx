import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import { Inter } from "next/font/google";
import { cn, constructMetadata } from "@/lib/utils";
import { Navbar } from "@/components/navs";
import { Toaster } from "@/components/ui/sonner";
import { TanstackProvider } from "@/providers/tanstack-query";
import { webcrypto } from "node:crypto";

// Polyfill the global crypto object
// As stated by lucia auth
globalThis.crypto = webcrypto as Crypto;

const inter = Inter({ subsets: ["latin"] });

export const metadata = constructMetadata();

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <TanstackProvider>
      <html lang='en' className='light'>
        <body
          className={cn(
            "min-h-screen font-sans antialiased grainy",
            inter.className
          )}
        >
          <Navbar />
          {children}
          <Toaster />
        </body>
      </html>
    </TanstackProvider>
  );
};

export default RootLayout;
