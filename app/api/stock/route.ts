"use server";

import { NextRequest, NextResponse } from "next/server";
import { listStockItems, replaceStockItems } from "@/lib/db";

type StockApiRow = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  system: string;
  zone: string;
  status: string;
  qty: number;
  available: number;
  pricePerDay: number;
  cost: number;
};

function mapFromDb(row: Awaited<ReturnType<typeof listStockItems>>[number]): StockApiRow {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    brand: row.brand,
    category: row.category,
    system: row.system,
    zone: row.zone,
    status: row.status,
    qty: row.qty,
    available: row.available,
    pricePerDay: row.price_per_day,
    cost: row.cost,
  };
}

// ✅ เปรียบเทียบ qty เดิมกับใหม่ แล้วสร้าง history entries
function buildHistoryEntries(
  previousRows: Awaited<ReturnType<typeof listStockItems>>,
  nextRows: StockApiRow[]
): Array<{
  id: string;
  stockId: string;
  stockCode: string;
  stockName: string;
  fieldName: string;
  changeType: "increase" | "decrease";
  oldValue: number;
  newValue: number;
  delta: number;
  createdAt: string;
}> {
  const previousById = new Map(previousRows.map((row) => [row.id, row]));
  const createdAt = new Date().toISOString();

  return nextRows.flatMap((row) => {
    const previous = previousById.get(row.id);
    if (!previous || previous.qty === row.qty) return [];

    const delta = row.qty - previous.qty;
    return [
      {
        id: `STH-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        stockId: row.id,
        stockCode: row.code,
        stockName: row.name,
        fieldName: "qty",
        changeType: delta > 0 ? "increase" : "decrease",
        oldValue: previous.qty,
        newValue: row.qty,
        delta,
        createdAt,
      },
    ];
  });
}

export async function GET() {
  const rows = await listStockItems();
  return NextResponse.json(rows.map(mapFromDb));
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.items)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const items = body.items as StockApiRow[];
  const valid = items.every((it) =>
    it?.id && it?.code && it?.name && it?.brand && it?.category &&
    it?.system && it?.zone && it?.status &&
    typeof it?.qty === "number" &&
    typeof it?.available === "number" &&
    typeof it?.pricePerDay === "number" &&
    typeof it?.cost === "number"
  );

  if (!valid) {
    return NextResponse.json({ error: "invalid stock items" }, { status: 400 });
  }

  // ✅ ดึงข้อมูลเดิมก่อน แล้วสร้าง history
  const currentRows = await listStockItems();
  const historyEntries = buildHistoryEntries(currentRows, items);

  await replaceStockItems(items, historyEntries);
  return NextResponse.json({ ok: true, count: items.length });
}
