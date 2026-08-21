import { useAuth } from "@/lib/auth";

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    return user.permissions?.[module]?.[action] ?? false;
  };
}
