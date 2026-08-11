import { requireProfile } from "@/lib/db";
import { MyItems } from "@/components/my-items";

export const dynamic = "force-dynamic";

export default async function MyItemsPage() {
  const profile = await requireProfile();

  return <MyItems userId={profile.id} />;
}
