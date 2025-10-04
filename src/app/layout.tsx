import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./css/globals.css";
import { Flowbite, ThemeModeScript } from "flowbite-react";
import customTheme from "@/utils/theme/custom-theme";
import "../utils/i18n";
import NextTopLoader from "nextjs-toploader";
import { Toaster } from "@/app/components/shadcn-ui/Default-Ui/toaster";
import { CustomizerContextProvider } from "./context/CustomizerContext";
import { AuthProvider } from "./context/AuthContext";
import { PermissionProvider } from "./context/PermissionContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationToast from "./components/NotificationToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DeltaYards",
  description: "DeltaYards",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <ThemeModeScript />
      </head>
      <body className={`${inter.className}`}>
        <Flowbite theme={{ theme: customTheme }}>
          <NextTopLoader color="var(--color-primary)" />
          <AuthProvider>
            <WebSocketProvider>
              <NotificationProvider>
                <PermissionProvider>
                  <CustomizerContextProvider>
                    {children}
                    <NotificationToast />
                  </CustomizerContextProvider>
                </PermissionProvider>
              </NotificationProvider>
            </WebSocketProvider>
          </AuthProvider>
        </Flowbite>
        <Toaster />
      </body>
    </html>
  );
}
