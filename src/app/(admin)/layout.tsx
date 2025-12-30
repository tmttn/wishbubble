import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gradient-mesh">
      <div className="flex">
        <AdminNav />
        <main className="flex-1 p-6 md:p-10">{children}</main>
      </div>
    </div>
  );
}
