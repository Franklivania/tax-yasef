/**
 * Skeleton loading component for user table
 */

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function UserTableSkeleton() {
  return (
    <Card className="border border-border">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="max-h-[calc(100vh-400px)] overflow-x-auto overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead className="w-[200px]">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="w-[150px]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="w-[120px]">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableHead key={i} className="text-center min-w-[180px]">
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-24 mx-auto" />
                      <Skeleton className="h-3 w-32 mx-auto" />
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-right w-[120px]">
                  <Skeleton className="h-4 w-24 ml-auto" />
                </TableHead>
                <TableHead className="text-right w-[120px]">
                  <Skeleton className="h-4 w-24 ml-auto" />
                </TableHead>
                <TableHead className="w-[100px]">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j} className="text-center">
                      <div className="flex flex-col gap-2 items-center">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
