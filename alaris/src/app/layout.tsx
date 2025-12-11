import type { Metadata } from "next";
import { Inter, Crimson_Pro } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  variable: "--font-crimson",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Alaris | Voice Tutor",
  description: "Train your mind through Oxford-style tutorial conversations. Develop argumentation, critical thinking, and intellectual curiosity with AI-powered Socratic dialogue.",
  keywords: ["tutoring", "education", "voice AI", "Oxford tutorials", "critical thinking", "Socratic method"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${crimsonPro.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
