import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import {
  AdminCommandMenuTrigger,
  AdminCommandMenuDialog,
} from "@/components/admin/admin-command-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="fixed inset-0 top-0 z-50 bg-background bg-gradient-mesh">
      {/* Command menu dialog - rendered once */}
      <AdminCommandMenuDialog />

      {/* Mobile header */}
      <AdminMobileNav />

      <div className="flex h-[calc(100%-56px)] md:h-full">
        {/* Desktop sidebar */}
        <AdminNav />

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop header with search */}
          <header className="hidden md:flex items-center justify-end h-14 px-6 border-b bg-card/30 backdrop-blur-sm">
            <AdminCommandMenuTrigger />
          </header>

          {/* Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-10 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
