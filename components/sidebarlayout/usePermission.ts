// hooks/usePermission.ts

import { EditorPermission, Permission } from "./permissions";
export enum UserRole {
  ADMIN = "admin",
  EDITOR = "editor",
}
const getPermissionsByRole = (role: any): string[] => {
  switch (role) {
    case UserRole.ADMIN:
      // Admin gets all permissions
      return Object.values(Permission);
    case UserRole.EDITOR:
      // Editor gets predefined permissions from EditorPermission array
      return EditorPermission;
    default:
      return [];
  }
};

export const usePermission = () => {
  const userPermissions = getPermissionsByRole(UserRole.ADMIN);

  /**
   * Check if user has a specific permission
   * @param permission - Permission to check
   * @returns boolean indicating if user has permission
   */
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  /**
   * Check if user has all specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean indicating if user has all permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return userPermissions.every((permission: any) =>
      permissions.includes(permission)
    );
  };

  /**
   * Check if user has any of the specified permissions
   * @param permissions - Array of permissions to check
   * @returns boolean indicating if user has at least one permission
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return userPermissions.some((permission: any) =>
      permissions.includes(permission)
    );
  };

  return {
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    userPermissions,
  };
};
