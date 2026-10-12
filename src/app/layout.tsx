import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { DemoDataProvider } from "@/components/demo/DemoDataProvider";

import { UserProvider } from "@/components/auth/UserContext";
import { db } from "@/lib/db";
import { currentUser, permittedUserIds, publicUserSelect } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Logistics CRM",
  description: "Phần mềm quản lý đơn hàng Logistics",
  icons: { icon: "/logo-mark.svg", apple: "/logo-mark.svg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await currentUser();
  const ids = user ? await permittedUserIds(user) : [];
  const users = user ? await db.user.findMany({ where: ids ? { id: { in: ids } } : {}, select: publicUserSelect }) : [];
  return (
    <html lang="vi">
      <body className={inter.className}>
        <DemoDataProvider>
          <UserProvider initialUsers={users} initialCurrentUser={user}>
            <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-white p-3 text-blue-700 shadow focus:not-sr-only">Đến nội dung chính</a>
            <AppShell>{children}</AppShell>
          </UserProvider>
        </DemoDataProvider>
      </body>
    </html>
  );
}
