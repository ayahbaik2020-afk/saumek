import { BorrowForm } from "@/components/borrow-form";

export const dynamic = "force-dynamic";

export default async function NewBorrowPage(props: PageProps<"/borrow/new">) {
  const searchParams = await props.searchParams;
  const raw = searchParams.item;
  const item = typeof raw === "string" ? raw : "";

  return <BorrowForm initialItemCode={item} />;
}
