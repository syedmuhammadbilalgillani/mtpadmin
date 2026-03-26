import { LucideIcon } from "lucide-react";
import { usePermission } from "./usePermission";
import { navigation } from "./navigationItems";

// Define types for the navigation structure
interface SubNavigationItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  requiredPermissions?: string[];
}

interface NavigationItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  requiredPermissions?: string[];
  items?: SubNavigationItem[];
}

interface NavigationGroup {
  title: string;
  icon?: LucideIcon;
  items: NavigationItem[];
}

export const usePermissionBasedNavigation = () => {
  const { hasAnyPermission } = usePermission();

  // Filter navigation groups and items based on permissions
  const filteredNavigation = navigation
    .map((group: NavigationGroup) => {
      // Filter items in each group
      const filteredItems = group.items
        .filter((item: NavigationItem) => {
          // If no permissions required, show the item
          if (!item?.requiredPermissions) return true;

          // If permissions required, check if user has any of them
          return hasAnyPermission(item?.requiredPermissions);
        })
        .map((item: NavigationItem) => {
          // For items with subitems, filter those too
          if (item?.items && item?.items.length > 0) {
            return {
              ...item,
              items: item?.items.filter((subItem: SubNavigationItem) => {
                if (!subItem.requiredPermissions) return true;
                return hasAnyPermission(subItem.requiredPermissions);
              }),
            };
          }
          return item;
        });

      // Return group with filtered items
      return {
        ...group,
        items: filteredItems,
      };
    })
    .filter((group: NavigationGroup) => group.items.length > 0); // Remove empty groups

  return filteredNavigation;
};
