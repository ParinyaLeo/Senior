import { ArrowRight, CornerDownLeft, Package } from "lucide-react";
import type { TabKey } from "./types";

export const ISSUE_RETURN_TABS: {
  key: TabKey;
  label: string;
  icon: typeof ArrowRight;
}[] = [
  {
    key: "issue",
    label: "Issue Equipment",
    icon: ArrowRight,
  },
  {
    key: "inuse",
    label: "In Use",
    icon: Package,
  },
  {
    key: "return",
    label: "Return Equipment",
    icon: CornerDownLeft,
  },
];