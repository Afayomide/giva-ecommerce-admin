"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";
import Sidebar from "@/components/dashboard/sidebar";
import Header from "@/components/dashboard/header";
import { useToast } from "@/components/ui/use-toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem("adminAuth");
        if (!token) {
          throw new Error("No token found");
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true, // Ensure cookies are sent with the request
          }
        );

        if (response.data.status !== "success") {
          throw new Error("Not authenticated");
        }

        setIsLoading(false);
      } catch (error) {
        toast({
          title: "Authentication required",
          description: "Please log in to access the admin dashboard",
          variant: "destructive",
        });
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router, toast]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-muted/30">
      <Sidebar isOpen={isSidebarOpen} pathname={pathname} />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
