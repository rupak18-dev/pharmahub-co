import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  Building2,
  Camera,
  Globe,
  IdCard,
  Landmark,
  Mail,
  MapPin,
  Phone,
  Save,
  Share2,
  ShieldCheck,
  Settings,
  Store,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
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
import { calculateProfileCompletion } from "@/lib/profileCompletion";
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

export default function EditProfilePage() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
    orgName: user?.orgName || "PharmaHub Pharmacy",
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
    businessType: user?.businessType || BUSINESS_CATEGORIES[0],
    services: user?.services || "Prescription Dispensing, OTC Medicines, Health Consultations",
    businessHours: user?.businessHours || "09:00 AM - 09:00 PM (Mon-Sat)",
    metaPixelId: user?.metaPixelId || "",
    branches: user?.branches || ["Main Branch (HQ)"],
  });

  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.replace("#", "");
      const elem = document.getElementById(sectionId);
      if (elem) {
        elem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location.hash]);

  const completion = calculateProfileCompletion(formData);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.orgName || !formData.orgName.trim()) {
      errs.orgName = "Studio Name is required";
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
      await new Promise((r) => setTimeout(r, 300));
      updateProfile(formData);
      toast.success("Profile saved successfully");
      navigate("/profile");
    } catch (err) {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
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
            onClick={() => navigate("/profile")}
            className="h-9 w-9 rounded-lg"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Profile</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Update your studio information and settings
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="space-y-6">
          {/* SECTION 1: Basic Information */}
          <div id="studio-info" className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <UserRound className="h-4 w-4 text-[#007A87]" /> Basic Information
            </h2>

            {/* Photos */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <Avatar className="h-16 w-16 border border-border">
                {formData.avatarUrl && <AvatarImage src={formData.avatarUrl} alt="Avatar" />}
                <AvatarFallback className="bg-[#007A87] text-white text-base font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Profile Photo & Studio Logo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => handleInputChange("avatarUrl", e.target.value)}
                    placeholder="Profile Photo Image URL"
                    className="rounded-lg text-xs h-8"
                  />
                  <Input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => handleInputChange("logoUrl", e.target.value)}
                    placeholder="Studio Logo URL"
                    className="rounded-lg text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="orgName" className="text-xs font-semibold">
                  Studio / Business Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="orgName"
                  value={formData.orgName}
                  onChange={(e) => handleInputChange("orgName", e.target.value)}
                  placeholder="PharmaHub Pharmacy"
                  className="rounded-lg text-xs"
                />
                {errors.orgName && <p className="text-[11px] text-destructive">{errors.orgName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tagline" className="text-xs font-semibold">Studio Tagline</Label>
                <Input
                  id="tagline"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange("tagline", e.target.value)}
                  placeholder="Your Trusted Neighborhood Pharmacy"
                  className="rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Pharmacy overview, specialization..."
                  className="rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Contact Information */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Phone className="h-4 w-4 text-[#007A87]" /> Contact Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="rounded-lg text-xs"
                />
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
                  placeholder="owner@pharmahub.com"
                  className="rounded-lg text-xs"
                />
                {errors.email && <p className="text-[11px] text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website" className="text-xs font-semibold">Website</Label>
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

          {/* SECTION 3: Business Information */}
          <div id="business-details" className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-[#007A87]" /> Business Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="gstin" className="text-xs font-semibold">GST Number (GSTIN)</Label>
                <Input
                  id="gstin"
                  value={formData.gstin}
                  onChange={(e) => handleInputChange("gstin", e.target.value)}
                  placeholder="27ABCDE1234F1Z5"
                  className="rounded-lg text-xs font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessType" className="text-xs font-semibold">Business Category</Label>
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

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address" className="text-xs font-semibold">Address</Label>
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
                <Label htmlFor="city" className="text-xs font-semibold">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                  placeholder="Mumbai"
                  className="rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs font-semibold">State</Label>
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

          {/* SECTION 4: Studio Information */}
          <div id="branches" className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Store className="h-4 w-4 text-[#007A87]" /> Studio Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="services" className="text-xs font-semibold">Services</Label>
                <Input
                  id="services"
                  value={formData.services}
                  onChange={(e) => handleInputChange("services", e.target.value)}
                  placeholder="Services offered"
                  className="rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="businessHours" className="text-xs font-semibold">Business Hours</Label>
                <Input
                  id="businessHours"
                  value={formData.businessHours}
                  onChange={(e) => handleInputChange("businessHours", e.target.value)}
                  placeholder="09:00 AM - 09:00 PM"
                  className="rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* SECTION 5: Marketing */}
          <div id="marketing" className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-foreground border-b border-border/50 pb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-[#007A87]" /> Marketing & Tracking
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="metaPixelId" className="text-xs font-semibold">Meta Pixel ID</Label>
              <Input
                id="metaPixelId"
                value={formData.metaPixelId}
                onChange={(e) => handleInputChange("metaPixelId", e.target.value)}
                placeholder="123456789012345"
                className="rounded-lg text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* ── Organization ─────────────────────────────────── */}
        <div id="organization" className="pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
            <Building2 className="h-4 w-4 text-[#007A87]" />
            <h2 className="text-sm font-semibold text-foreground">Organization</h2>
          </div>
          <OrganizationSection />
        </div>

        {/* ── Settings ──────────────────────────────────────── */}
        <div id="settings" className="pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
            <Settings className="h-4 w-4 text-[#007A87]" />
            <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          </div>
          <BusinessSettingsSection />
        </div>

        {/* ── Security ─────────────────────────────────────── */}
        <div id="security" className="pt-2">
          <div className="flex items-center gap-2 pb-3 border-b border-border/60 mb-4">
            <ShieldCheck className="h-4 w-4 text-[#007A87]" />
            <h2 className="text-sm font-semibold text-foreground">Security</h2>
          </div>
          <SecuritySection />
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/profile")}
            disabled={saving}
            className="rounded-lg h-9 px-4 text-xs font-medium"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#007A87] text-white hover:bg-[#007A87]/90 rounded-lg h-9 px-5 text-xs font-medium gap-2 shadow-xs"
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
