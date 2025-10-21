import Footer from "@/components/footer";
import Header from "@/components/shared/header";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prostore",
  description: "Ecommerce with Nextjs",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-screen flex-col">
      {/* <Header /> */}
      <main className="flex-1 wrapper">{children}</main>
      {/* <Footer /> */}
    </div>
  );
}
