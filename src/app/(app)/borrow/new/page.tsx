import { BorrowForm } from "@/components/borrow-form";

export const dynamic = "force-dynamic";

export default async function NewBorrowPage(props: PageProps<"/borrow/new">) {
  const searchParams = await props.searchParams;
  const rawItem = searchParams.item;
  const rawJob = searchParams.job;
  const item = typeof rawItem === "string" ? rawItem : "";
  const job = typeof rawJob === "string" ? rawJob : "";

  return <BorrowForm initialItemCode={item} initialJobId={job} />;
}
