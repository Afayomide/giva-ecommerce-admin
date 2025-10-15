import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { IOrder } from "@/types/order.type";

// Define the types based on the MongoDB model
interface ICustomer {
  _id: string;
  fullname: string;
  username:string
  email: string;
}

interface IProduct {
  _id: string;
  name: string;
  image?: string;
}

interface IProductItem {
  productId: string | IProduct;
  quantity: number;
  price: number;
}

interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}


interface RecentOrdersTableProps {
  orders: IOrder[];
}

export default function RecentOrdersTable({
  orders = [],
}: RecentOrdersTableProps) {
  // Function to get the appropriate badge color based on order status
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "shipped":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Function to get the appropriate badge color based on payment status
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "not paid":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "refunded":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  

  // Function to get customer email
  const getCustomerEmail = (order: IOrder): string => {
    // If user is populated (is an object)
    if (typeof order.user === "object" && order.user !== null) {
      return order.user.email || "No email";
    }
    // Fallback
    return "No email";
  };

  // Function to get product name
  const getProductName = (item: IProductItem): string => {
    // If productId is populated (is an object)
    if (typeof item.productId === "object" && item.productId !== null) {
      return item.productId.name || "Unknown Product";
    }
    // If productId is just an ID
    return `Product ${
      typeof item.productId === "string"
        ? item.productId.substring(0, 6)
        : "Unknown"
    }`;
  };

  // Function to get initials from customer name
  const getInitials = (name: string) => {
    if (!name || name === "Unknown" || name === "Unknown Customer") return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};
  // Format date
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "Unknown date";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Invalid date";
    }
  };

  // Generate order reference
  const getOrderReference = (order: IOrder) => {
    return (
      order.paymentReference || `ORD-${order._id.substring(0, 8).toUpperCase()}`
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Product</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center py-6 text-muted-foreground"
              >
                No recent orders found
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order._id}>
                <TableCell className="font-medium">
                  {getOrderReference(order)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getInitials(getCustomerEmail(order))}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
      
                      <span className="text-xs text-muted-foreground">
                        {getCustomerEmail(order)}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {order.items && order.items.length > 0
                    ? getProductName(order.items[0]) +
                      (order.items.length > 1
                        ? ` +${order.items.length - 1} more`
                        : "")
                    : "N/A"}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getOrderStatusColor(
                      order.status
                    )} capitalize`}
                    variant="outline"
                  >
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${getPaymentStatusColor(
                      order.paymentStatus
                    )} capitalize`}
                    variant="outline"
                  >
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(order.createdAt)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
