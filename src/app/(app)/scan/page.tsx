import { ScanClient } from "@/components/scan-client";

export const dynamic = "force-dynamic";

export default async function ScanPage(props: PageProps<"/scan">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.code;
  const code = typeof raw === "string" ? raw : "";

  return <ScanClient initialCode={code} />;
}
