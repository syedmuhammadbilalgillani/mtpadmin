import {
  Boxes,
  ShoppingBag,
  Tags
} from "lucide-react";
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
        title: "Marketplace",
        url: "/modules/marketplace",
        icon: ShoppingBag,
        isActive: false,
        requiredPermissions: [Permission.READ_CATEGORY],
      },
    ],
  },
];
