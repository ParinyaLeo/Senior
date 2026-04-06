"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  deductStockForEventIssue,
  deleteEventById,
  getEventById,
  updateEventDecision,
  updateEventIssueStatus,
} from "@/lib/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await req.json().catch(() => null);

  if (body?.issueStatus) {
    if (!["ready", "inuse", "returned"].includes(body.issueStatus)) {
      return NextResponse.json({ error: "invalid issueStatus" }, { status: 400 });
    }

    const current = await getEventById(id);
    if (!current) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    const rowCount = await updateEventIssueStatus(id, body.issueStatus);
    if (rowCount === 0) {
      return NextResponse.json({ error: "event not found" }, { status: 404 });
    }

    if (body.issueStatus === "inuse" && current.issue_status !== "inuse") {
      await deductStockForEventIssue(id);
    }

    return NextResponse.json({ ok: true });
  }

  if (!body?.startDate || !body?.endDate || !Array.isArray(body?.equipment) || !body?.decision) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const decision = body.decision === "approved" ? "approved" : "rejected";
  const rowCount = await updateEventDecision({
    id,
    startDate: body.startDate,
    endDate: body.endDate,
    itemsCount: body.equipment.length,
    statusText: decision === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ",
    statusTone: decision === "approved" ? "success" : "rejected",
    equipment: body.equipment,
  });

  if (rowCount === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const rowCount = await deleteEventById(id);
  if (rowCount === 0) {
    return NextResponse.json({ error: "event not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
