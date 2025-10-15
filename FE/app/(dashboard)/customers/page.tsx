"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, MoreVertical, Eye, XCircle, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { ICustomer } from "@/types/customer.type";

export default function UsersPage() {
  const [users, setUsers] = useState<ICustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("adminAuth");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      if (!token || !apiUrl) {
        console.error("Missing auth token or API URL");
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        

        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();
        console.log(data)
        setUsers(data.data.customers || data.customers || []);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Filter users
  const filteredUsers = users.filter((user: ICustomer) => {
    const matchesSearch =
      user.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to && user.createdAt) {
      const createdDate = new Date(user.createdAt);
      matchesDateRange =
        createdDate >= dateRange.from && createdDate <= dateRange.to;
    }

    return matchesSearch && matchesDateRange;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a: ICustomer, b: ICustomer) => {
    if (!sortConfig) return 0;

    const key = sortConfig.key as keyof ICustomer;
    if ((a[key] ?? "") < (b[key] ?? "")) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if ((a[key] ?? "") > (b[key] ?? "")) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setDateRange(undefined);
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <Button variant="outline" onClick={resetFilters}>
          Reset Filters
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("fullname")}
              >
                <div className="flex items-center">
                  Name
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("email")}
              >
                <div className="flex items-center">
                  Email
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>

              <TableHead className="text-center">Cart</TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("createdAt")}
              >
                <div className="flex items-center">
                  Created At
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>

              <TableHead
                className="cursor-pointer"
                onClick={() => requestSort("updatedAt")}
              >
                <div className="flex items-center">
                  Updated At
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </div>
              </TableHead>

              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user) => (
                <TableRow key={user._id?.toString()}>
                  <TableCell className="font-medium">{user.fullname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={user.cartLength ? "default" : "secondary"}
                    >
                      {user.cartLength || 0} item
                      {user.cartLength === 1 ? "" : "s"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.updatedAt), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      {/* <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger> */}
                      {/* <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => router.push(`/users/${user._id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent> */}
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-6 text-muted-foreground"
                >
                  No users found. Try adjusting your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
