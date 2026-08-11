"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardHeader, ErrorMessage, Input, Select, Textarea } from "@/components/ui";
import { createItem, updateItem, type ActionState } from "@/lib/item-actions";
import type { Category, Item, Location } from "@/lib/types";

export function ItemForm({
  categories,
  locations,
  item,
}: {
  categories: Category[];
  locations: Location[];
  item?: Item | null;
}) {
  const router = useRouter();
  const action = item ? updateItem : createItem;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    {}
  );

  const submit = (formData: FormData) => {
    formAction(formData);
    if (state?.id) {
      router.push(`/inventory/${state.id}`);
    }
  };

  return (
    <form action={submit} className="space-y-4">
      <Card>
        <CardHeader title={item ? "Edit Barang" : "Tambah Barang"} />
        <div className="space-y-4 p-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="item_code"
              label="Kode Barang *"
              placeholder="contoh: MT-001"
              defaultValue={item?.item_code}
              required
            />
            <Input
              name="name"
              label="Nama Barang *"
              placeholder="contoh: Multimeter FLUKE"
              defaultValue={item?.name}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="category_id"
              label="Kategori"
              defaultValue={item?.category_id ?? ""}
            >
              <option value="">- Pilih Kategori -</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Select
              name="location_id"
              label="Lokasi Penyimpanan"
              defaultValue={item?.location_id ?? ""}
            >
              <option value="">- Pilih Lokasi -</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input name="brand" label="Merk" defaultValue={item?.brand ?? ""} />
            <Input name="model" label="Type / Model" defaultValue={item?.model ?? ""} />
            <Input name="serial_number" label="Serial Number" defaultValue={item?.serial_number ?? ""} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Input
              name="quantity"
              label="Jumlah / Stok *"
              type="number"
              min={0}
              defaultValue={item?.quantity ?? 1}
              required
            />
            <Input name="unit" label="Satuan" defaultValue={item?.unit ?? "pcs"} />
            <Select name="condition" label="Kondisi" defaultValue={item?.condition ?? "GOOD"}>
              <option value="GOOD">Baik</option>
              <option value="LIGHT_DAMAGE">Rusak Ringan</option>
              <option value="HEAVY_DAMAGE">Rusak Berat</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="LOST">Hilang</option>
            </Select>
            <Select name="status" label="Status" defaultValue={item?.status ?? "AVAILABLE"}>
              <option value="AVAILABLE">Available</option>
              <option value="BORROWED">Dipinjam</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="DAMAGED">Rusak</option>
              <option value="LOST">Hilang</option>
              <option value="INACTIVE">Tidak Aktif</option>
            </Select>
          </div>
          <Input
            name="photo_url"
            label="URL Foto"
            placeholder="https://... (opsional)"
            defaultValue={item?.photo_url ?? ""}
          />
          <Textarea
            name="description"
            label="Keterangan"
            rows={3}
            defaultValue={item?.description ?? ""}
          />
        </div>
      </Card>

      <ErrorMessage message={state?.error} />
      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button type="button" variant="secondary" href={`/inventory${item ? `/${item.id}` : ""}`}>
          Batal
        </Button>
      </div>
    </form>
  );
}
