import type { Metadata } from "next";
import AdminClient from "@/components/admin/AdminClient";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <AdminClient />;
}
