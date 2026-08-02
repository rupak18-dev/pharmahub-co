import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getImageForMedicine = (id: string, form: string | undefined) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  if (form?.toLowerCase().includes("syrup") || form?.toLowerCase().includes("suspension")) {
    const syrupImages = [
      "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1512069772995-36be0b57e0e7?auto=format&fit=crop&w=400&q=80"
    ];
    return syrupImages[hash % syrupImages.length];
  }
  const pillImages = [
    "https://images.unsplash.com/photo-1584308666744-24d5e4a2bc1d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1550572017-edb3df4197e7?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1583947581924-860bda6a5a0d?auto=format&fit=crop&w=400&q=80",
    "https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=400&q=80",
  ];
  return pillImages[hash % pillImages.length];
};
