"use client";

import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Upload,
  X,
} from "lucide-react";
import type { IssueEvent } from "../types";

type Props = {
  open: boolean;
  event: IssueEvent | null;
  onConfirm: (damaged: boolean, photos: File[]) => void;
  onCancel: () => void;
};

export default function ConfirmReturnModal({
  open,
  event,
  onConfirm,
  onCancel,
}: Props) {
  const [isDamaged, setIsDamaged] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!open) {
      setIsDamaged(false);
      setPhotos([]);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const canConfirm = !isDamaged || photos.length > 0;

  if (!open || !event) return null;

  return (
    <div className="fixed inset-0 z-[150]">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 p-5">
            <div>
              <div className="text-lg font-semibold text-zinc-900">
                ยืนยันการคืนอุปกรณ์
              </div>
              <div className="mt-1 text-sm text-zinc-500">
                "{event.title}" • {event.equipment}
              </div>
            </div>

            <button
              onClick={onCancel}
              className="grid h-9 w-9 place-items-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-4 px-5 pb-5">
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm hover:bg-zinc-50">
              <input
                type="checkbox"
                checked={isDamaged}
                onChange={(e) => setIsDamaged(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-red-600"
              />
              <span>อุปกรณ์มีความเสียหาย/ชำรุด</span>
            </label>

            {isDamaged ? (
              <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <div className="text-sm font-semibold text-red-800">
                    พบความเสียหาย
                  </div>
                  <div className="text-xs text-red-600">
                    กรุณาอัปโหลดรูปหลักฐาน
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <div className="text-sm font-semibold text-emerald-800">
                    อุปกรณ์อยู่ในสภาพดี
                  </div>
                  <div className="text-xs text-emerald-600">
                    ไม่พบความเสียหาย
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 text-sm font-semibold text-zinc-800">
                รูปภาพหลักฐาน{" "}
                {isDamaged ? (
                  <span className="text-red-600">*</span>
                ) : (
                  <span className="font-normal text-zinc-400">(ไม่บังคับ)</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  <Camera className="h-4 w-4" />
                  เปิดกล้อง
                </button>

                <button
                  type="button"
                  onClick={() => uploadRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
                >
                  <Upload className="h-4 w-4" />
                  อัปโหลดรูป
                </button>
              </div>

              <input
                ref={uploadRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setPhotos((p) => [...p, ...Array.from(e.target.files!)]);
                  }
                }}
              />

              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) {
                    setPhotos((p) => [...p, ...Array.from(e.target.files!)]);
                  }
                }}
              />

              {photos.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {photos.map((f, i) => (
                    <div
                      key={i}
                      className="truncate rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-600"
                    >
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                ยกเลิก
              </button>

              <button
                onClick={() => onConfirm(isDamaged, photos)}
                disabled={!canConfirm}
                className="flex-1 h-10 rounded-xl bg-blue-600 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                ยืนยันการคืน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}