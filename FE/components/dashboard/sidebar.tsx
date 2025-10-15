"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, LogOut, ChevronRight, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface SidebarProps {
  isOpen: boolean
  pathname: string
}

interface SidebarItem {
  title: string
  href: string
  icon: React.ReactNode
  submenu?: { title: string; href: string }[]
}

export default function Sidebar({ isOpen, pathname }: SidebarProps) {
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const sidebarItems: SidebarItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Products",
      href: "/products",
      icon: <Package className="h-5 w-5" />,
      submenu: [
        { title: "All Products", href: "/products" },
        { title: "Add Product", href: "/products/add" },
        { title: "Categories", href: "/products/categories" },
      ],
    },
    {
      title: "Orders",
      href: "/orders",
      icon: <ShoppingBag className="h-5 w-5" />,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: <Users className="h-5 w-5" />,
    },
  ]

  const toggleSubmenu = (title: string) => {
    if (openSubmenu === title) {
      setOpenSubmenu(null)
    } else {
      setOpenSubmenu(title)
    }
  }

  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem("adminAuth")

    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the admin dashboard",
    })

    router.push("/login")
  }

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        "bg-card border-r border-border transition-all duration-300 h-screen flex flex-col z-30",
        isOpen ? "w-64" : "w-[70px]",
      )}
    >
      <div className="p-4 border-b border-border flex items-center justify-center h-16">
        {isOpen ? <h1 className="font-bold text-xl">GODS WEARS</h1> : <span className="font-bold text-xl">AR</span>}
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {sidebarItems.map((item) => (
            <li key={item.title}>
              {item.submenu ? (
                <div>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal h-10",
                      isActive(item.href) && "bg-muted font-medium",
                      !isOpen && "justify-center px-0",
                    )}
                    onClick={() => toggleSubmenu(item.title)}
                  >
                    {item.icon}
                    {isOpen && (
                      <>
                        <span className="ml-3 flex-1 text-left">{item.title}</span>
                        {openSubmenu === item.title ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </Button>

                  {isOpen && openSubmenu === item.title && (
                    <ul className="mt-1 space-y-1 pl-10">
                      {item.submenu.map((subitem) => (
                        <li key={subitem.title}>
                          <Link href={subitem.href}>
                            <Button
                              variant="ghost"
                              className={cn(
                                "w-full justify-start font-normal h-8 text-sm",
                                pathname === subitem.href && "bg-muted font-medium",
                              )}
                            >
                              {subitem.title}
                            </Button>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start font-normal h-10",
                      isActive(item.href) && "bg-muted font-medium",
                      !isOpen && "justify-center px-0",
                    )}
                  >
                    {item.icon}
                    {isOpen && <span className="ml-3">{item.title}</span>}
                  </Button>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start font-normal h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
            !isOpen && "justify-center px-0",
          )}
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          {isOpen && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  )
}

