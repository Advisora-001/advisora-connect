import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advisora Connect — Find Trusted Legal Professionals",
  description: "Advisora Connect connects you with verified lawyers across Africa. Search, discover, and book consultations with trusted legal professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-primary/10">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="bg-accent text-white py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col items-center mb-6">
                <Image
                  src="/advisora.png"
                  alt="Advisora Connect"
                  width={160}
                  height={45}
                  className="object-contain brightness-0 invert mb-4"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mb-4">
                <a href="/terms-of-use" className="text-primary/70 hover:text-white text-sm transition-colors">Terms of Use</a>
                <a href="/privacy-policy" className="text-primary/70 hover:text-white text-sm transition-colors">Privacy Policy</a>
                <a href="/data-protection" className="text-primary/70 hover:text-white text-sm transition-colors">Data Protection</a>
                <a href="/code-of-conduct" className="text-primary/70 hover:text-white text-sm transition-colors">Code of Conduct</a>
              </div>
              <div className="text-center border-t border-primary/20 pt-4">
                <p className="text-primary/80">&copy; 2026 Advisora Connect. All rights reserved.</p>
                <p className="text-primary/60 text-sm mt-1">Connecting you with trusted legal professionals.</p>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}