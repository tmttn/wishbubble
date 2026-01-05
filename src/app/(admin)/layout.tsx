import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 top-0 z-50 bg-background bg-gradient-mesh">
      <div className="flex h-full">
        <AdminNav />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
