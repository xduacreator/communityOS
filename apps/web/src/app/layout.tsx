import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from '../components/AuthProvider';

export const metadata: Metadata = {
  title: "Latih.Club - Platform Manajemen Kelas & Komunitas",
  description: "Platform all-in-one untuk membangun, mengelola, dan melejitkan bisnis kelas & aktivitas Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased text-slate-800 bg-slate-50"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
