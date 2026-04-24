import { ArrowRight, CornerDownLeft, Package } from "lucide-react";
import type { TabKey } from "./types";

export const ISSUE_RETURN_TABS: {
  key: TabKey;
  label: string;
  icon: typeof ArrowRight;
}[] = [
  {
    key: "issue",
    label: "เบิกอุปกรณ์",
    icon: ArrowRight,
  },
  {
    key: "inuse",
    label: "กำลังใช้งาน",
    icon: Package,
  },
  {
    key: "return",
    label: "คืนอุปกรณ์",
    icon: CornerDownLeft,
  },
];
