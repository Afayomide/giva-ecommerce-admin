"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { IOrder } from "@/types/order.type";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem("adminAuth");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!token || !apiUrl) return;

        const res = await fetch(`${apiUrl}/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to fetch order");
        const data = await res.json();
        setOrder(data.data.order);
        console.log(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Order not found.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      {order && (
        <>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
            <Button variant="outline" onClick={() => history.back()}>
              ← Back
            </Button>
          </div>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p>
                  <strong>Order ID:</strong> {order._id}
                </p>
                <p>
                  <strong>Customer:</strong> {order.user?.fullname || "N/A"}
                </p>
                <p>
                  <strong>Email:</strong> {order.email}
                </p>
                <p>
                  <strong>Phone:</strong> {order.address.phone}
                </p>
              </div>
              <div className="space-y-1">
                <p>
                  <strong>Order Date:</strong>{" "}
                  {format(order.createdAt, "MMM dd, yyyy")}
                </p>
                <p>
                  <strong>Payment Ref:</strong>{" "}
                  {order.paymentReference || "N/A"}
                </p>
                <div>
                  <strong>Payment Status:</strong>{" "}
                  <Badge className={getPaymentColor(order.paymentStatus)}>
                    {order.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <strong>Order Status:</strong>{" "}
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-relaxed">
              <div className="space-y-1">
                <p>
                  {order.address.firstName} {order.address.lastName}
                </p>
                <p>{order.address.address}</p>
                <p>
                  {order.address.city}, {order.address.state}
                </p>
                <p>
                  {order.address.country} - {order.address.zipCode}
                </p>
                <p>{order.address.phone}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Items</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {order.items.map((item, idx) => {
                    if (!item.product) {
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row gap-4 py-4 items-center sm:items-start text-muted-foreground"
                        >
                          <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md border bg-gray-100 flex items-center justify-center">
                            <p className="text-xs text-center">
                              Product not available
                            </p>
                          </div>
                          <div className="flex-1 space-y-1 text-sm">
                            <p className="font-semibold">
                              This product is no longer available.
                            </p>
                            <p>Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right font-semibold text-base">
                            ₦{item.price.toFixed(2)}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <Link
                        href={`/products/${item.product._id}`}
                        key={idx}
                        className="flex flex-col sm:flex-row gap-4 py-4 items-center sm:items-start"
                      >
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md border">
                          <img
                            src={
                              item.product?.images?.[0] || "/placeholder.jpg"
                            }
                            alt={item.product?.name || "Product"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 space-y-1 text-sm">
                          <p className="font-semibold">{item.product?.name}</p>
                          {item.size && <p>Size: {item.size}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                          <p>Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right font-semibold text-base">
                          ₦{item.price.toFixed(2)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No items in this order.
                </p>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>₦{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
