import { ReturnList } from "@/components/return-list";

export const dynamic = "force-dynamic";

export default async function ReturnsPage(props: PageProps<"/returns">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.item;
  const item = typeof raw === "string" ? raw : "";

  return <ReturnList itemCode={item} />;
}
