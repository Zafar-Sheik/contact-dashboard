// components/Sidebar.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/images/logo.png";
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  DollarSign,
  Cloud,
  FileText,
  Folder,
  Code,
  ChevronLeft,
  ChevronRight,
  Menu,
  User,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: "Task Management",
      href: "/tasks",
      icon: <CheckSquare className="w-5 h-5" />,
    },
    {
      name: "Staff Management",
      href: "/staff",
      icon: <Users className="w-5 h-5" />,
    },
    {
      name: "Budget Tracker",
      href: "/budget-tracker",
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      name: "Cloud Backups",
      href: "/cloud-backups",
      icon: <Cloud className="w-5 h-5" />,
    },
    {
      name: "Contracts",
      href: "/contracts",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      name: "Projects",
      href: "/projects",
      icon: <Folder className="w-5 h-5" />,
    },
    {
      name: "Project Manager",
      href: "https://project-management-app-ten-phi.vercel.app/",
      icon: <Folder className="w-5 h-5" />,
    },
    {
      name: "Development",
      href: "/development-projects",
      icon: <Code className="w-5 h-5" />,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bg-gray-800 text-white transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">Dashboard</h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-300 hover:text-white"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navigationItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all group relative ${
              isActive(item.href)
                ? "bg-blue-600 text-white shadow-sm"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            } ${isCollapsed ? "justify-center" : ""}`}>
            <span className={`shrink-0 ${isCollapsed ? "" : "mr-3"}`}>
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="flex-1 truncate">{item.name}</span>
            )}
            {isCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg border border-gray-700">
                {item.name}
              </div>
            )}
          </Link>
        ))}
      </nav>

      {/* Logo */}
      <div className="p-4 bg-white border-r border-gray-700">
        <div
          className={`flex ${
            isCollapsed ? "justify-center" : "justify-start"
          }`}>
          <Image
            src={Logo}
            alt="Company Logo"
            width={isCollapsed ? 32 : 120}
            height={isCollapsed ? 32 : 40}
            className={`object-contain ${
              isCollapsed ? "w-10 h-10" : "w-40 h-15"
            }`}
            priority
          />
        </div>
      </div>
    </div>
  );
}
