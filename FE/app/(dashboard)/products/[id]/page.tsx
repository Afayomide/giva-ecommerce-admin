"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Pencil, Save, X } from "lucide-react";
import { IProduct } from "@/types/product.type";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem("adminAuth");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) return;

      const res = await fetch(`${apiUrl}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      setProduct(data.data.product);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!product) return;
    const { name, value } = e.target;
    setProduct({ ...product, [name]: value });
  };

  const handleArrayChange = (name: keyof IProduct, value: string) => {
    if (!product) return;
    const arr = value.split(",").map((v) => v.trim());
    setProduct({ ...product, [name]: arr });
  };

 
 const handleSave = async () => {
   if (!product) return;
   setSaving(true);

   try {
     const token = localStorage.getItem("adminAuth");
     const apiUrl = process.env.NEXT_PUBLIC_API_URL;
     if (!token || !apiUrl) return;

     // Exclude images and any unwanted fields
     const { images, createdAt, updatedAt, __v, ...rest } = product;

     // Convert arrays or objects to plain JSON-safe data
     const cleanProduct: Record<string, any> = {};
     Object.entries(rest).forEach(([key, value]) => {
       if (Array.isArray(value)) cleanProduct[key] = value;
       else if (typeof value === "object" && value !== null)
         cleanProduct[key] = JSON.parse(JSON.stringify(value));
       else cleanProduct[key] = value;
     });

     const res = await fetch(`${apiUrl}/products/${product._id}`, {
       method: "PUT",
       headers: {
         "Content-Type": "application/json",
         Authorization: `Bearer ${token}`,
       },
       body: JSON.stringify(cleanProduct),
     });

     if (!res.ok) throw new Error("Failed to update product");

     setEditing(false);
     await fetchProduct();
   } catch (err) {
     console.error("Error updating product:", err);
   } finally {
     setSaving(false);
   }
 };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-muted-foreground">
        Loading product details...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Product not found.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Product Details</h1>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => history.back()}>
            ← Back
          </Button>
          {!editing ? (
            <Button onClick={() => setEditing(true)} variant="secondary">
              <Pencil className="w-4 h-4 mr-2" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => setEditing(false)}
                variant="outline"
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-2" /> Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Product Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Product Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block font-medium">Name</label>
            <Input
              name="name"
              value={product.name}
              onChange={handleChange}
              disabled={!editing}
            />
            <label className="block font-medium">Categories</label>
            <Input
              value={product.categories.join(", ")}
              onChange={(e) => handleArrayChange("categories", e.target.value)}
              disabled={!editing}
            />
            <label className="block font-medium">Types</label>
            <Input
              value={product.types.join(", ")}
              onChange={(e) => handleArrayChange("types", e.target.value)}
              disabled={!editing}
            />
            <label className="block font-medium">Colors</label>
            <Input
              value={product.colors.join(", ")}
              onChange={(e) => handleArrayChange("colors", e.target.value)}
              disabled={!editing}
            />
            <label className="block font-medium">Gender</label>
            <Input
              name="gender"
              value={product.gender}
              onChange={handleChange}
              disabled={!editing}
            />
          </div>

          <div className="space-y-3">
            <label className="block font-medium">Price</label>
            <Input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              disabled={!editing}
            />
            <label className="block font-medium">Discount Price</label>
            <Input
              type="number"
              name="discountPrice"
              value={product.discountPrice}
              onChange={handleChange}
              disabled={!editing}
            />
            <label className="block font-medium">Quantity</label>
            <Input
              type="number"
              name="quantity"
              value={product.quantity}
              onChange={handleChange}
              disabled={!editing}
            />
            <label className="block font-medium">Status</label>
            <Badge
              className={
                product.status === "in stock"
                  ? "bg-green-100 text-green-800"
                  : product.status === "low stock"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }
            >
              {product.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Product Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {product.images.map((img, idx) => (
              <div key={idx} className="relative w-full aspect-square">
                <Image
                  src={img || "/placeholder.jpg"}
                  alt={`Product ${idx}`}
                  fill
                  className="rounded-lg object-cover border"
                />
              </div>
            ))}
          </div>

          {/* Don't show upload field in edit mode */}
          {/* If you ever want to re-enable image uploads, you can reintroduce this safely */}
        </CardContent>
      </Card>

      {/* Description & Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={product.description.join("\n")}
            onChange={(e) => handleArrayChange("description", e.target.value)}
            disabled={!editing}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Care Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={product.instructions.join("\n")}
            onChange={(e) => handleArrayChange("instructions", e.target.value)}
            disabled={!editing}
            rows={6}
          />
        </CardContent>
      </Card>
    </div>
  );
}
