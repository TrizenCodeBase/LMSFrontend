import { Loader2 } from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";

interface TableLoaderProps {
  colSpan: number;
  message?: string;
}

export const TableLoader = ({ colSpan, message = "Loading..." }: TableLoaderProps) => {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center">
        <div className="flex justify-center items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>{message}</span>
        </div>
      </TableCell>
    </TableRow>
  );
}; 