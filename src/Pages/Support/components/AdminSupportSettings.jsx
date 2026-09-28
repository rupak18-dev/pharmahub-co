import React, { useState, useEffect } from "react";
import {
  Save,
  RotateCcw,
  Sliders,
  Mail,
  Phone,
  FileText,
  Clock,
  HelpCircle,
  Layers,
  Sparkles,
  Eye,
  CheckCircle2,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import { Label } from "@/Components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Components/ui/card";
import { Badge } from "@/Components/ui/badge";
import { supportService } from "@/lib/supportService";
import { CategoryIcon } from "../supportConfig";

export function AdminSupportSettings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState(supportService.getDefaultSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [newCatIcon, setNewCatIcon] = useState("");
  const [showAddCat, setShowAddCat] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await supportService.getSettings();
        setSettings(data);
      } catch {
        toast.error("Failed to load settings from server");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await supportService.updateSettings(settings);
      setSettings(updated);
      toast.success("Global Support customization saved to database successfully!");
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
    } catch (err) {
      toast.error(err.message || "Failed to save support settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset all Support customization to defaults?",
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const defaults = supportService.getDefaultSettings();
      const updated = await supportService.updateSettings(defaults);
      setSettings(updated);
      toast.success("Support settings reset to default values");
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
    } catch (err) {
      toast.error(err.message || "Failed to reset settings");
    } finally {
      setResetting(false);
    }
  };

  const handleAddCategory = () => {
    if (!newCatLabel.trim()) {
      toast.error("Category label is required");
      return;
    }

    const id = newCatLabel
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    const newCat = {
      id: id || `cat_${Date.now()}`,
      label: newCatLabel.trim(),
      icon: newCatIcon || "CircleHelp",
      desc: newCatDesc.trim(),
    };

    setSettings((prev) => ({
      ...prev,
      categories: [...(prev.categories || []), newCat],
    }));

    setNewCatLabel("");
    setNewCatDesc("");
    setNewCatIcon("");
    setShowAddCat(false);
    toast.success(`Category "${newCat.label}" added to draft list. Remember to click Save.`);
  };

  const handleRemoveCategory = (catId) => {
    setSettings((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== catId),
    }));
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        Loading support configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Sliders className="h-5 w-5 text-emerald-600" />
                Global Support Page Customization
              </CardTitle>
              <CardDescription className="text-xs">
                Changes saved here are stored in the database and immediately reflected globally for all PharmaHub users.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDefaults}
                disabled={resetting || saving}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Defaults</span>
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || resetting}
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? "Saving to DB..." : "Save Customization"}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Grid: Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Settings Form (7 cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
          {/* Header & Description Settings */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                Header & Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cfg-title" className="text-xs font-semibold">
                  Support Page Title
                </Label>
                <Input
                  id="cfg-title"
                  value={settings.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  placeholder="e.g. Help & Support Desk"
                  className="text-xs h-9"
                />
                <span className="text-[10px] text-muted-foreground">
                  The primary heading shown at the top of the Support page.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cfg-desc" className="text-xs font-semibold">
                  Support Page Subtitle / Description
                </Label>
                <Textarea
                  id="cfg-desc"
                  rows={2}
                  value={settings.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="e.g. Submit support tickets, report technical or inventory issues..."
                  className="text-xs resize-none"
                />
                <span className="text-[10px] text-muted-foreground">
                  Summary copy displayed below the main heading.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Details & SLA */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-emerald-600" />
                Support Channels & SLA Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="cfg-email" className="text-xs font-semibold flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Support Desk Email
                  </Label>
                  <Input
                    id="cfg-email"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleChange("supportEmail", e.target.value)}
                    placeholder="support@pharmahub.co"
                    className="text-xs h-9"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Email Desk quick action link.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="cfg-phone" className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Support Phone Number / Helpline
                  </Label>
                  <Input
                    id="cfg-phone"
                    value={settings.supportPhone}
                    onChange={(e) => handleChange("supportPhone", e.target.value)}
                    placeholder="1800-PHARMA-HELP"
                    className="text-xs h-9"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Call Helpline quick action number.
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cfg-sla" className="text-xs font-semibold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  Support SLA Text
                </Label>
                <Input
                  id="cfg-sla"
                  value={settings.slaText}
                  onChange={(e) => handleChange("slaText", e.target.value)}
                  placeholder="e.g. Priority Live Helpdesk · Standard 4h-24h turnaround"
                  className="text-xs h-9"
                />
                <span className="text-[10px] text-muted-foreground">
                  Shown in the SLA card banner on the user Support overview.
                </span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cfg-help" className="text-xs font-semibold flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Solutions / FAQ Guidance Text
                </Label>
                <Textarea
                  id="cfg-help"
                  rows={2}
                  value={settings.helpInfo}
                  onChange={(e) => handleChange("helpInfo", e.target.value)}
                  placeholder="Information or turn-around commitments..."
                  className="text-xs resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Support Categories Manager */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/80 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-emerald-600" />
                Support Issue Categories ({settings.categories?.length || 0})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCat(!showAddCat)}
                className="h-7 text-xs gap-1"
              >
                <Plus className="h-3 w-3 text-emerald-600" />
                <span>Add Category</span>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {showAddCat && (
                <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2 mb-3">
                  <div className="text-xs font-semibold text-foreground">Add Custom Category</div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input
                      placeholder="Icon name (e.g. Pill, Package)"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      className="h-8 text-xs col-span-1"
                    />
                    <Input
                      placeholder="Category Label"
                      value={newCatLabel}
                      onChange={(e) => setNewCatLabel(e.target.value)}
                      className="h-8 text-xs col-span-3"
                    />
                  </div>
                  <Input
                    placeholder="Short description / guidance"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="h-8 text-xs"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAddCat(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddCategory}
                      className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Add to List
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {(settings.categories || []).map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border/80 bg-muted/20 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryIcon id={cat.id} className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {cat.label}
                        </div>
                        {cat.desc && (
                          <div className="text-[10px] text-muted-foreground truncate max-w-sm">
                            {cat.desc}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      className="text-muted-foreground hover:text-rose-600 p-1 transition-colors"
                      title="Remove category"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="h-9 px-5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? "Saving to Database..." : "Save Customization Globally"}</span>
            </Button>
          </div>
        </form>

        {/* Live Preview Box (5 cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-4">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="p-4 pb-2 border-b border-border/80">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-emerald-600" />
                Live User Preview
              </CardTitle>
              <CardDescription className="text-[11px]">
                This is how regular users will view the Support section:
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              {/* Header Preview */}
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/20 dark:border-emerald-950 dark:bg-emerald-950/20 space-y-2">
                <div className="text-base font-bold text-foreground">
                  {settings.title || "Help & Support Desk"}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {settings.description || "Submit support tickets..."}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className="inline-flex items-center gap-1 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded">
                    <Mail className="h-3 w-3" />
                    <span>{settings.supportEmail || "support@pharmahub.co"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] text-foreground font-medium bg-muted px-2 py-0.5 rounded border border-border">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{settings.supportPhone || "1800-PHARMA-HELP"}</span>
                  </div>
                </div>
              </div>

              {/* SLA Preview */}
              <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-background p-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
                  SLA
                </div>
                <div>
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    PharmaHub Support SLA
                  </div>
                  <div className="text-xs font-medium text-foreground">
                    {settings.slaText || "Priority Live Helpdesk"}
                  </div>
                </div>
              </div>

              {/* Category Dropdown Sample */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <div className="text-[11px] font-semibold text-muted-foreground">
                  Sample Category Selector in Raise Ticket:
                </div>
                <div className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <CategoryIcon id={settings.categories?.[0]?.id || "billing_pos"} className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{settings.categories?.[0]?.label || "Billing, POS Issue"}</span>
                  </span>
                  <Badge variant="secondary" className="text-[9px] shrink-0">
                    {settings.categories?.length || 0} Categories
                  </Badge>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Normal users have read-only access. When you save, every connected browser will see these updated details.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
