"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Upload, X } from "lucide-react";
import axios from "axios";
import { Progress } from "@/components/ui/progress";

export default function AddProductPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const existingCategories = ["ankara", "aso-oke", "dansiki", "lace"];
  const existingTypes = ["fabric", "clothing", "accessory", "footwear"];

  const [categoryInput, setCategoryInput] = useState("");
  const [typeInput, setTypeInput] = useState("");

   const handleAddArrayItem = (
     inputValue: string,
     field: "categories" | "types"
   ) => {
     if (!inputValue.trim()) return;
     setFormData((prev) => ({
       ...prev,
       [field]: Array.from(
         new Set([...prev[field], inputValue.trim().toLowerCase()])
       ),
     }));
     if (field === "categories") setCategoryInput("");
     if (field === "types") setTypeInput("");
   };

   const handleRemoveArrayItem = (
     field: "categories" | "types",
     index: number
   ) => {
     setFormData((prev) => ({
       ...prev,
       [field]: prev[field].filter((_, i) => i !== index),
     }));
   };

  const [formData, setFormData] = useState({
    name: "",
    categories: [] as string[],
    types: [] as string[],
    colors: [] as string[],
    tribe: "",
    description: "",
    price: "",
    quantity: "",
    material: "",
    instructions: "",
  });

  const router = useRouter();
  const { toast } = useToast();

  const getAuthToken = () => localStorage.getItem("adminAuth");

  // ✅ Handle comma-separated arrays (e.g., colors)
  const handleArrayInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "categories" | "types" | "colors"
  ) => {
    const value = e.target.value;
    const arrayValues = value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v !== "");
    setFormData((prev) => ({
      ...prev,
      [field]: arrayValues,
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSelectArrayChange = (
    value: string,
    field: "categories" | "types"
  ) => {
    setFormData((prev) => {
      const alreadySelected = prev[field].includes(value);
      return {
        ...prev,
        [field]: alreadySelected
          ? prev[field].filter((v) => v !== value) // toggle off
          : [...prev[field], value], // toggle on
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const submitData = {
      ...formData,
      images: uploadedImageUrls,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      if (!response.ok) throw new Error("Failed to add product");

      toast({
        title: "Product added successfully",
        description: "The product has been added to your inventory",
      });
      router.push("/products");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("image", file));

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/upload/product-image`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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
      setUploadedImageUrls((prev) => [...prev, data.data.url]);
      setImages((prev) => [
        ...prev,
        ...Array.from(files).map((file) => URL.createObjectURL(file)),
      ]);
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

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6 animate-in">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Add New Product</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="details">Details & Pricing</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          {/* ✅ BASIC INFORMATION */}
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Enter the basic details of your product.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    placeholder="Premium Ankara Fabric"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categories</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.categories.map((cat, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                      >
                        {cat}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveArrayItem("categories", index)
                          }
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type or pick a category..."
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddArrayItem(categoryInput, "categories");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        handleAddArrayItem(categoryInput, "categories")
                      }
                    >
                      Add
                    </Button>
                  </div>

                  {/* Suggested existing categories */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingCategories.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={
                          formData.categories.includes(option)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleAddArrayItem(option, "categories")}
                        className="text-xs"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label>Product Types</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.types.map((type, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm"
                      >
                        {type}
                        <button
                          type="button"
                          onClick={() => handleRemoveArrayItem("types", index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Type or pick a type..."
                      value={typeInput}
                      onChange={(e) => setTypeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddArrayItem(typeInput, "types");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleAddArrayItem(typeInput, "types")}
                    >
                      Add
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {existingTypes.map((option) => (
                      <Button
                        key={option}
                        type="button"
                        variant={
                          formData.types.includes(option)
                            ? "default"
                            : "outline"
                        }
                        onClick={() => handleAddArrayItem(option, "types")}
                        className="text-xs"
                      >
                        {option}
                      </Button>
                    ))}
                  </div>
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a detailed description..."
                    rows={5}
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="button" onClick={() => setActiveTab("details")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ✅ DETAILS */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Details & Pricing</CardTitle>
                <CardDescription>
                  Set the pricing and inventory details.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="49.99"
                      required
                      value={formData.price}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quantity">Stock Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      placeholder="100"
                      required
                      value={formData.quantity}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="material">Material</Label>
                  <Input
                    id="material"
                    placeholder="100% Cotton"
                    value={formData.material}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <Label htmlFor="colors">Colors</Label>
                  <Input
                    id="colors"
                    placeholder="e.g., Red, Blue, Green"
                    value={formData.colors.join(", ")}
                    onChange={(e) => handleArrayInputChange(e, "colors")}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter multiple colors separated by commas.
                  </p>
                </div>

                <div>
                  <Label htmlFor="instructions">Care Instructions</Label>
                  <Textarea
                    id="instructions"
                    placeholder="Hand wash in cold water..."
                    rows={3}
                    value={formData.instructions}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("basic")}
                >
                  Previous
                </Button>
                <Button type="button" onClick={() => setActiveTab("images")}>
                  Next
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* ✅ IMAGES */}
          <TabsContent value="images">
            <Card>
              <CardHeader>
                <CardTitle>Product Images</CardTitle>
                <CardDescription>
                  Upload high-quality images of your product.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                    />
                    <Label
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
                    </Label>
                  </div>
                  
                  {isUploading && (
                    <div className="space-y-2">
                        <Progress value={uploadProgress} className="w-full" />
                        <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgress}%</p>
                    </div>
                  )}

                  {images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className="h-32 w-full object-cover rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab("details")}
                >
                  Previous
                </Button>
                <Button type="submit" disabled={isSubmitting || isUploading}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Product"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  );
}
