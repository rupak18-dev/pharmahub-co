import { useAuth } from "@/lib/auth";

export function usePermission() {
  const { user } = useAuth();
  return (module, action = "view") => {
    if (!user) return false;
    if (user.role === "Owner") return true;
    return user.permissions?.[module]?.[action] ?? false;
  };
}
