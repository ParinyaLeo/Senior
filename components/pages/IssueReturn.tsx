import type { Role, StockRow } from "../AppShell";
import IssueReturnPage from "../features/issue-return/IssueReturnPage";

type Props = {
  role: Role;
  stockData: StockRow[];
  onDeductStock: (equipmentList: { name: string; qty: number }[]) => void;
  onReturnStock: (equipmentList: { name: string; qty: number }[]) => void;
  onMarkDamagedStock: (equipmentList: { name: string; qty: number }[]) => void;
  onMarkEventAsIssued?: (eventId: string) => void;
  onUnmarkEventAsIssued?: (eventId: string) => void;
};

export default function IssueReturn(props: Props) {
  return <IssueReturnPage {...props} />;
}