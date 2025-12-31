import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { canCreateGroup } from "@/lib/plans";
import { NewBubbleForm } from "./new-bubble-form";
import { LimitReached } from "./limit-reached";

export default async function NewBubblePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const limitCheck = await canCreateGroup(session.user.id);
  const t = await getTranslations("bubbles");

  if (!limitCheck.allowed) {
    return (
      <LimitReached
        current={limitCheck.current}
        limit={limitCheck.limit}
        upgradeRequired={limitCheck.upgradeRequired}
      />
    );
  }

  return <NewBubbleForm />;
}
