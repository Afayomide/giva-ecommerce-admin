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
import { Pencil, Save, X, Upload } from "lucide-react";
import { IProduct } from "@/types/product.type";
import axios from "axios";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!product) return;
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("image", file));

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("adminAuth");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token || !apiUrl) return;

      const response = await axios.post(
        `${apiUrl}/upload/product-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || progressEvent.loaded;
            const progress = Math.round((progressEvent.loaded * 100) / total);
            setUploadProgress(progress);
          },
        }
      );

      const data = response.data;
      const newImageUrl = data.data.url;
      
      setProduct((prev) => {
        if (!prev) return null;
        return {
            ...prev,
            images: [...prev.images, newImageUrl]
        }
      });

      toast({
        title: "Image uploaded",
        description: "Don't forget to save changes.",
      });

    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
 
 const handleSave = async () => {
   if (!product) return;
   setSaving(true);

   try {
     const token = localStorage.getItem("adminAuth");
     const apiUrl = process.env.NEXT_PUBLIC_API_URL;
     if (!token || !apiUrl) return;

     // Exclude unnecessary fields but KEEP images
     const { createdAt, updatedAt, __v, ...rest } = product;

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
     toast({
        title: "Success",
        description: "Product updated successfully",
      });
   } catch (err) {
     console.error("Error updating product:", err);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
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

  const handleRemoveImage = (index: number) => {
    if (!product) return;
    const newImages = [...product.images];
    newImages.splice(index, 1);
    setProduct({ ...product, images: newImages });
  };

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
            <label className="block font-medium">Price (₦)</label>
            <Input
              type="number"
              name="price"
              value={product.price}
              onChange={handleChange}
              disabled={!editing}
            />
            <label className="block font-medium">Discount Price (₦)</label>
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
              <div key={idx} className="relative w-full aspect-square group">
                <Image
                  src={img || "/placeholder.jpg"}
                  alt={`Product ${idx}`}
                  fill
                  className="rounded-lg object-cover border"
                />
                {editing && (
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {editing && (
            <div className="mt-6 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="flex flex-col items-center justify-center cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium">
                    Drag & drop images here or click to browse
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Supports JPG, PNG, WEBP (Max 5MB each)
                  </span>
                </label>
                 {isUploading && (
                  <div className="mt-4 space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                  </div>
                )}
             </div>
          )}
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
