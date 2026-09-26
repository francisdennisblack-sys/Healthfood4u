import type { Metadata } from "next";
import GlobalPrivacyModal from "@/components/GlobalPrivacyModal";
import WebsiteChat from "@/components/WebsiteChat";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthFood4U | Healthy Foods",
  description: "Clean eating essentials, fresh groceries, and wellness products for a healthier everyday routine.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
        {children}
        <GlobalPrivacyModal />
        {(process.env.NODE_ENV === "development" || process.env.CHAT_ENABLED === "true") && <WebsiteChat />}
      </body>
    </html>
  );
}
