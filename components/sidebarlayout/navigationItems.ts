import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Briefcase,
  Users,
  Settings,
} from "lucide-react";
import { Permission } from "./permissions";
export const navigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    items: [
      {
        title: "Home",
        url: "/admin/",
        icon: LayoutDashboard,
        isActive: true,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Media",
        url: "/admin/file-manager",
        icon: FolderKanban,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Recent Updates",
        url: "/admin/recent-updates",
        icon: FileText,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Practice Areas",
        url: "/admin/practice-areas",
        icon: Briefcase,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Attorneys",
        url: "/admin/attorneys",
        icon: Users,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Case Studies",
        url: "/admin/case-studies",
        icon: FileText,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
        isActive: false,
        requiredPermissions: [Permission.READ_USER],
      },
    ],
  },
];
