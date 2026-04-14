import { Boxes, Calendar, FileText, MapPin, Tags } from "lucide-react";
import { Permission } from "./permissions";
export const navigation = [
  {
    title: "Modules",
    icon: Boxes,
    items: [
      {
        title: "Categories",
        url: "/modules/category",
        icon: Tags,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      },
      {
        title: "Posts",
        url: "/modules/post",
        icon: FileText,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      },
      {
        title: "Cities",
        url: "/modules/city",
        icon: MapPin,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      },
      {
        title: "Feature Plans",
        url: "/modules/feature-plan",
        icon: Calendar,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      },
      {
        title: "States",
        url: "/modules/state",
        icon: MapPin,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      }
    ],
  },
];
