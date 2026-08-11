import { ReturnForm } from "@/components/return-form";

export const dynamic = "force-dynamic";

export default async function ReturnDetailPage(props: PageProps<"/returns/[id]">) {
  const { id } = await props.params;

  return <ReturnForm borrowingId={id} />;
}
