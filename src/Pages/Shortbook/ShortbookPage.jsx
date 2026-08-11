import { PackageSearch } from "lucide-react";

export default function ShortbookPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#007A87]/10 text-[#007A87]">
        <PackageSearch className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Shortbook</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Coming soon. This section is under development and will be available shortly.
      </p>
    </div>
  );
}
