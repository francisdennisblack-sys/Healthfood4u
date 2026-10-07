import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import GlobalPrivacyModal from "@/components/GlobalPrivacyModal";
import WebsiteChat from "@/components/WebsiteChat";
import "./globals.css";

const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const headingFont = Lora({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  title: "HealthFood4U | Healthy Foods",
  description: "Clean eating essentials, fresh groceries, and wellness products for a healthier everyday routine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}>
      <body>
        {children}
        <GlobalPrivacyModal />
        {(process.env.NODE_ENV === "development" || process.env.CHAT_ENABLED === "true") && <WebsiteChat />}
      </body>
    </html>
  );
}
