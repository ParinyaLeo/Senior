import type { Role, StockRow } from "../AppShell";
import ReportsPage from "../features/reports/ReportsPage";

type Props = {
  role: Role;
  stockData: StockRow[];
};

export default function Reports(props: Props) {
  return <ReportsPage {...props} />;
}