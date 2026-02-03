"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  Users,
  Banknote,
  Package,
  TrendingUp,
  TrendingDown,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import RecentOrdersTable from "@/components/dashboard/recent-orders-table";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { format } from "date-fns";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"];
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_URL}/stats`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminAuth")}`,
        },
      });

      // Fetch recent orders
      const ordersResponse = await axios.get(
        `${API_URL}/dashboard/recent-orders`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminAuth")}`,
          },
        }
      );

      setDashboardStats(statsResponse.data.data);
      setRecentOrders(ordersResponse.data?.data.orders.slice(0, 10) || []);
      console.log(ordersResponse);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    try {
      setIsRefreshing(true);

      await axios.post(
        `${API_URL}/stats/update-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminAuth")}`,
          },
        }
      );

      toast({
        title: "Statistics Updated",
        description: "Dashboard statistics have been refreshed",
      });

      await fetchDashboardData();
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast({
        title: "Error",
        description: "Failed to refresh statistics",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Prepare chart data for monthly sales
  const salesData =
    dashboardStats.monthlySales?.map((item: any) => ({
      name: format(new Date(item.year, item.month - 1), "MMM"),
      sales: item.revenue,
    })) || [];

  // Prepare chart data for product categories
  const productCategoryData =
    dashboardStats.products?.productsByCategories?.map((item: any) => ({
      name: item.categories,
      value: item.count,
    })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Stats
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            Download Report
          </Button>
        </div>
      </div>

      {dashboardStats.sales?.lastUpdated && (
        <p className="text-sm text-muted-foreground">
          Last updated:{" "}
          {format(new Date(dashboardStats.sales.lastUpdated), "PPpp")}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₦{dashboardStats.sales?.totalRevenue?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`flex items-center ${
                  dashboardStats.sales?.revenueChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {dashboardStats.sales?.revenueChange >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {dashboardStats.sales?.revenueChange >= 0 ? "+" : ""}
                {dashboardStats.sales?.revenueChange?.toFixed(1) || "0.0"}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.sales?.orderCount?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`flex items-center ${
                  dashboardStats.sales?.orderChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {dashboardStats.sales?.orderChange >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {dashboardStats.sales?.orderChange >= 0 ? "+" : ""}
                {dashboardStats.sales?.orderChange?.toFixed(1) || "0.0"}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.products?.totalProducts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-500 flex items-center">
                <TrendingDown className="mr-1 h-3 w-3" />
                {dashboardStats.products?.outOfStockCount || 0}
              </span>{" "}
              out of stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats.customers?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span
                className={`flex items-center ${
                  dashboardStats.customers?.customerChange >= 0
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {dashboardStats.customers?.customerChange >= 0 ? (
                  <TrendingUp className="mr-1 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-1 h-3 w-3" />
                )}
                {dashboardStats.customers?.customerChange >= 0 ? "+" : ""}
                {dashboardStats.customers?.customerChange?.toFixed(1) || "0.0"}%
              </span>{" "}
              from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isClient && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₦${value}`, "Revenue"]} />
                  <Bar dataKey="sales" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card> */}

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {isClient && productCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={productCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {productCategoryData.map((index: any) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, "Products"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  No category data available
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentOrdersTable orders={recentOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
