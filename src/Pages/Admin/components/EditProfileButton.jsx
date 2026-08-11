import { useNavigate } from "react-router";
import { Pencil } from "lucide-react";
import { Button } from "@/Components/ui/button";

export function EditProfileButton({ className }) {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline"
      size="sm"
      className={className ?? "h-9 text-xs font-semibold rounded-xl gap-1.5"}
      onClick={() => navigate("/profile/edit")}
    >
      <Pencil className="h-3.5 w-3.5" /> Edit Profile
    </Button>
  );
}
