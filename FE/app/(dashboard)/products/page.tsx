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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  MoreVertical,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { IProduct } from "@/types/product.type";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsPage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  const getAuthToken = () => localStorage.getItem("adminAuth");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/products`, {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data.data.products);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ✅ Filter products (by search, category, type, and status)
  const filteredProducts = products.filter((product: IProduct) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory && selectedCategory !== "all"
        ? product.categories?.includes(selectedCategory)
        : true;

    const matchesType =
      selectedType && selectedType !== "all"
        ? product.types?.includes(selectedType)
        : true;

    const matchesStatus =
      selectedStatus && selectedStatus !== "all"
        ? product.status === selectedStatus
        : true;

    return matchesSearch && matchesCategory && matchesType && matchesStatus;
  });

  // ✅ Sort products
  const sortedProducts = [...filteredProducts].sort(
    (a: IProduct, b: IProduct) => {
      if (!sortConfig) return 0;
      const key = sortConfig.key as keyof IProduct;

      const aValue = Array.isArray(a[key]) ? a[key][0] : a[key];
      const bValue = Array.isArray(b[key]) ? b[key][0] : b[key];

      if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    }
  );

  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // ✅ Delete product
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`${API_URL}/products/${productToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      if (!response.ok) throw new Error("Failed to delete product");

      setProducts(products.filter((p) => p._id !== productToDelete));
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // ✅ Get unique categories and types dynamically from products
  const uniqueCategories = Array.from(
    new Set(products.flatMap((p) => p.categories || []))
  ).filter((cat) => cat !== "");
  const uniqueTypes = Array.from(
    new Set(products.flatMap((p) => p.types || []))
  ).filter((type) => type !== "");

  return (
    <div className="space-y-6 animate-in">
      {loading ? (
        <div className="text-center py-6">Loading products...</div>
      ) : error ? (
        <div className="text-center py-6 text-destructive">{error}</div>
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold tracking-tight">Products</h1>
            <Button onClick={() => router.push("/products/add")}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {/* Category Filter */}
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Type Filter */}
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in stock">In Stock</SelectItem>
                  <SelectItem value="low stock">Low Stock</SelectItem>
                  <SelectItem value="out of stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("");
                  setSelectedType("");
                  setSelectedStatus("");
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox />
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("name")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      Product Name <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("categories")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      Categories <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("types")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      Types <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead
                    onClick={() => requestSort("price")}
                    className="text-right cursor-pointer"
                  >
                    <div className="flex items-center justify-end">
                      Price <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead
                    onClick={() => requestSort("status")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      Status <ArrowUpDown className="ml-2 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {sortedProducts.length > 0 ? (
                  sortedProducts.map((product: IProduct) => (
                    <TableRow key={product._id}>
                      <TableCell>
                        <Checkbox />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        {product.categories?.length
                          ? product.categories.join(", ")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {product.types?.length ? product.types.join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        ₦{product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {product.quantity}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "in stock"
                              ? "default"
                              : product.status === "low stock"
                              ? "warning"
                              : "destructive"
                          }
                        >
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/products/${product._id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" /> View
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setProductToDelete(product._id);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-6 text-muted-foreground"
                    >
                      No products found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Delete Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Are you sure you want to delete this product?
                </DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete the
                  product from the database.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteProduct}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
