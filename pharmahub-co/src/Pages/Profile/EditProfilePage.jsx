import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Landmark,
  Loader2,
  Phone,
  RefreshCw,
  Settings,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { usePermission } from "@/hooks/usePermission";
import { resolveAssetUrl } from "@/lib/api";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { Textarea } from "@/Components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/Components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { OrganizationSection } from "@/Pages/Admin/components/OrganizationSection";
import { BusinessSettingsSection } from "@/Pages/Admin/components/BusinessSettingsSection";
import { SecuritySection } from "@/Pages/Admin/components/SecuritySection";

export const handle = { title: "Edit Profile · PharmaHub" };

const BUSINESS_CATEGORIES = [
  "Independent Retail Pharmacy",
  "Pharmacy Chain Store",
  "Hospital & Clinical Pharmacy",
  "Wholesale Pharmaceutical Distributor",
  "Specialty Compounding Pharmacy",
];

function EditProfileSkeleton() {
  return (
    <div className="w-full pb-20 pt-2">
      <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 sm:px-6">
        <div className="h-9 w-56 animate-pulse rounded-lg bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function EditProfileError({ onRetry }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">Your profile could not be loaded.</p>
      <Button
        type="button"
        size="sm"
        onClick={onRetry}
        className="h-9 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-semibold"
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}

export default function EditProfilePage() {
  const { user, loading, updateProfile, uploadAvatar, removeAvatar } = useAuth();
  const has = usePermission();
  const isAdmin = has("admin", "view");
  const [hash, setHash] = useState(window.location.hash);

  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
    orgName: user?.orgName || "",
    tagline: user?.tagline || "",
    logoUrl: user?.logoUrl || "",
    description: user?.description || "",
    businessEmail: user?.businessEmail || "",
    website: user?.website || "",
    address: user?.address || "",
    city: user?.city || "",
    state: user?.state || "",
    pincode: user?.pincode || "",
    gstin: user?.gstin || "",
    licenseNo: user?.licenseNo || "",
    businessType: user?.businessType || "",
    services: user?.services || "",
    businessHours: user?.businessHours || "",
    metaPixelId: user?.metaPixelId || "",
    branches: user?.branches || [],
  });

  // Initialize the form from the hydrated user exactly once. Subsequent user
  // updates (e.g. after an avatar upload) must not wipe unsaved edits.
  const formInitialized = useRef(false);
  useEffect(() => {
    if (!user || formInitialized.current) return;
    formInitialized.current = true;
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      avatarUrl: user.avatarUrl || "",
      orgName: user.orgName || "",
      tagline: user.tagline || "",
      logoUrl: user.logoUrl || "",
      description: user.description || "",
      businessEmail: user.businessEmail || "",
      website: user.website || "",
      address: user.address || "",
      city: user.city || "",
      state: user.state || "",
      pincode: user.pincode || "",
      gstin: user.gstin || "",
      licenseNo: user.licenseNo || "",
      businessType: user.businessType || "",
      services: user.services || "",
      businessHours: user.businessHours || "",
      metaPixelId: user.metaPixelId || "",
      branches: user.branches || [],
    });
  }, [user]);

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (hash) {
      const sectionId = hash.slice(1);
      const elem = document.getElementById(sectionId);

      if (elem) {
        elem.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [hash]);

  if (loading) return <EditProfileSkeleton />;

  if (!user) return <EditProfileError onRetry={() => window.location.reload()} />;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (isAdmin && (!formData.orgName || !formData.orgName.trim())) {
      errs.orgName = "Pharma Name is required";
    }
    if (!formData.name || !formData.name.trim()) {
      errs.name = "Full Name is required";
    }
    if (!formData.email || !formData.email.trim()) {
      errs.email = "Email Address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errs.email = "Enter a valid email address";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill in required fields.");
      return;
    }

    setSaving(true);
    try {
      const { avatarUrl: _avatarUrl, logoUrl: _logoUrl, ...profileFields } = formData;
      await updateProfile(profileFields);
      toast.success("Profile saved successfully");
      window.location.href = "/profile";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Only JPEG, PNG or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image is too large — maximum size is 5 MB.");
      return;
    }
    setAvatarUploading(true);
    try {
      const updated = await uploadAvatar(file);
      if (updated?.avatarUrl) {
        handleInputChange("avatarUrl", updated.avatarUrl);
        toast.success("Profile photo updated.");
      } else {
        toast.error("The photo could not be applied. Please try again.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload profile photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const updated = await removeAvatar();
      if (updated && updated.avatarUrl == null) {
        handleInputChange("avatarUrl", "");
        toast.success("Profile photo removed.");
      } else {
        toast.error("The photo could not be removed. Please try again.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove profile photo.");
    } finally {
      setAvatarUploading(false);
    }
  };

  const initials = (formData.name || "User")
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full pb-20 pt-2">
      <div className="mx-auto w-full max-w-[900px] space-y-6 px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              window.location.href = "/profile";
            }}
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Update your pharma information and settings
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div id="profile-info" className="space-y-6">
          {/* SECTION 1: Basic Information */}
          <div
            id="studio-info"
            className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5"
          >
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" /> Basic Information
            </h2>

            {/* Profile Photo Upload Control */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold">Profile Photo</Label>
              <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
                <div className="relative group">
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={avatarUploading}
                    onChange={handleAvatarUpload}
                  />
                  <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                    <Avatar className="h-16 w-16 border-2 border-border group-hover:border-primary transition-colors shadow-xs">
                      {formData.avatarUrl && (
                        <AvatarImage
                          src={resolveAssetUrl(formData.avatarUrl)}
                          alt="Profile Photo"
                          className="object-cover"
                        />
                      )}
                      <AvatarFallback className="bg-primary text-primary-foreground text-base font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                      <Camera className="h-5 w-5" />
                    </div>
                  </label>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-foreground">Profile Photo</span>
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="avatar-upload"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md cursor-pointer transition-colors ${
                        avatarUploading ? "opacity-60 pointer-events-none" : ""
                      }`}
                    >
                      <Upload className="h-3 w-3" />
                      {avatarUploading ? "Uploading…" : "Upload Photo"}
                    </label>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={handleRemoveAvatar}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    JPEG, PNG or WEBP · max 5 MB
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-xs font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Your full name"
                  className="rounded-lg text-xs"
                />
                {errors.name && <p className="text-[11px] text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold">
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="you@pharmahub.com"
                  className="rounded-lg text-xs"
                />
                {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="rounded-lg text-xs"
                />
              </div>

              {isAdmin && (
                <div className="space-y-1.5">
                  <Label htmlFor="orgName" className="text-xs font-semibold">
                    Pharma / Business Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="orgName"
                    value={formData.orgName}
                    onChange={(e) => handleInputChange("orgName", e.target.value)}
                    placeholder="PharmaHub Pharmacy"
                    className="rounded-lg text-xs"
                  />
                  {errors.orgName && (
                    <p className="text-[11px] text-destructive">{errors.orgName}</p>
                  )}
                </div>
              )}

              {isAdmin && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="tagline" className="text-xs font-semibold">
                    Pharma Tagline
                  </Label>
                  <Input
                    id="tagline"
                    value={formData.tagline}
                    onChange={(e) => handleInputChange("tagline", e.target.value)}
                    placeholder="Your Trusted Neighborhood Pharmacy"
                    className="rounded-lg text-xs"
                  />
                </div>
              )}

              {isAdmin && (
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Pharmacy overview, specialization..."
                    className="rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Contact Information — owner/admin only */}
          {isAdmin && (
            <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
              <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessEmail" className="text-xs font-semibold">
                    Business Email
                  </Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                    placeholder="contact@pharmahub.com"
                    className="rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="website" className="text-xs font-semibold">
                    Website
                  </Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://pharmahub.com"
                    className="rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: Business Information — owner/admin only */}
          {isAdmin && (
            <div
              id="business-details"
              className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5"
            >
              <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
                <Landmark className="h-4 w-4 text-primary" /> Business Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gstin" className="text-xs font-semibold">
                    GST Number (GSTIN)
                  </Label>
                  <Input
                    id="gstin"
                    value={formData.gstin}
                    onChange={(e) => handleInputChange("gstin", e.target.value)}
                    placeholder="27ABCDE1234F1Z5"
                    className="rounded-lg text-xs font-mono uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="businessType" className="text-xs font-semibold">
                    Business Category
                  </Label>
                  <Select
                    value={formData.businessType}
                    onValueChange={(v) => handleInputChange("businessType", v)}
                  >
                    <SelectTrigger id="businessType" className="rounded-lg text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="licenseNo" className="text-xs font-semibold">
                    License Number
                  </Label>
                  <Input
                    id="licenseNo"
                    value={formData.licenseNo}
                    onChange={(e) => handleInputChange("licenseNo", e.target.value)}
                    placeholder="DL-27-PHN-000123"
                    className="rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-semibold">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Street address..."
                    className="rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="city" className="text-xs font-semibold">
                    City
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="Mumbai"
                    className="rounded-lg text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="state" className="text-xs font-semibold">
                    State
                  </Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="Maharashtra"
                    className="rounded-lg text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Organization ─────────────────────────────────── */}
        {isAdmin && (
          <div id="organization" className="pt-2">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Organization</h2>
            </div>
            <OrganizationSection />
          </div>
        )}

        {/* ── Settings ──────────────────────────────────────── */}
        {isAdmin && (
          <div id="settings" className="pt-2">
            <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
              <Settings className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Settings</h2>
            </div>
            <BusinessSettingsSection />
          </div>
        )}

        {/* ── Security ─────────────────────────────────────── */}
        <div id="security" className="pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Security</h2>
          </div>
          <SecuritySection />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              window.location.href = "/profile";
            }}
            disabled={saving}
            className="rounded-lg h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-9 px-5 text-xs font-medium gap-2 shadow-xs"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
