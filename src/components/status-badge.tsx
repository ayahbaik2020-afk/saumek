import { Badge } from "@/components/ui";
import {
  BORROWING_STATUS,
  ITEM_STATUS,
} from "@/lib/constants";
import type { BorrowingStatus, ItemStatus } from "@/lib/types";

export function ItemStatusBadge({ status }: { status: ItemStatus }) {
  const meta = ITEM_STATUS[status] ?? ITEM_STATUS.INACTIVE;
  return <Badge className={meta.color}>{meta.label}</Badge>;
}

export function BorrowingStatusBadge({ status }: { status: BorrowingStatus }) {
  const meta = BORROWING_STATUS[status] ?? BORROWING_STATUS.BORROWED;
  return <Badge className={meta.color}>{meta.label}</Badge>;
}
