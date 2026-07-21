import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Navbar from "@/components/Navbar";
import CookieConsent from "@/components/CookieConsent";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Advisora Connect — Find Trusted Legal Professionals",
  description: "Advisora Connect connects you with verified lawyers across Africa. Search, discover, and book consultations with trusted legal professionals.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
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
              <div className="flex justify-center gap-6 mb-6">
                <a
                  href="https://www.linkedin.com/company/advisora-connect/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary/60 hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
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
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}