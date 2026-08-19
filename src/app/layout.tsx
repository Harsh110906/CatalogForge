import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "CatalogForge — AI-Powered Industrial Catalog Intelligence",
  description:
    "Transform fragmented supplier data into structured, validated, commerce-ready product records with 2026 AI Agentic Commerce compliance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
