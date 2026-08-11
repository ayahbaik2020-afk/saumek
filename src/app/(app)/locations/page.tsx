import { requireAdmin } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { LocationManager } from "@/components/location-manager";
import type { Location } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: locations = [] } = await supabase
    .from("locations")
    .select("*")
    .order("name");

  return <LocationManager locations={locations as Location[]} />;
}
