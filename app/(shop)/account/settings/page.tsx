"use client";

import { useEffect, useState } from "react";
import { Camera, KeyRound, Save, User } from "lucide-react";
import { api, uploadImage } from "@/lib/client";
import { useShop } from "@/components/providers/ShopProvider";
import { PageLoader } from "@/components/ui";

export default function SettingsPage() {
  const { user, setUser, showToast } = useShop();
  const [busy, setBusy] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", avatar: "" });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email, phone: user.phone || "", avatar: user.avatar || "" });
  }, [user]);

  if (!user) return <PageLoader />;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ user: any }>("/api/account/profile", {
        method: "PATCH",
        body: { name: profile.name, phone: profile.phone, avatar: profile.avatar || undefined },
      });
      setUser(res.user);
      showToast("Profile updated");
    } catch (err: any) {
      showToast(err.message || "Could not update profile", "error");
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) {
      showToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (pwd.newPassword !== pwd.confirm) {
      showToast("Passwords do not match.", "error");
      return;
    }
    setPwBusy(true);
    try {
      await api("/api/account/password", {
        method: "PATCH",
        body: { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword },
      });
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
      showToast("Password changed successfully");
    } catch (err: any) {
      showToast(err.message || "Could not change password", "error");
    } finally {
      setPwBusy(false);
    }
  };

  const onAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setProfile((p) => ({ ...p, avatar: url }));
    } catch (err: any) {
      showToast(err.message || "Upload failed", "error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <User className="h-5 w-5 text-brand-600" /> Profile Details
        </h2>
        <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-brand-100">
                {profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl font-bold text-brand-700">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <label className="btn-secondary cursor-pointer">
                <Camera className="mr-1.5 inline h-4 w-4" />
                {uploading ? "Uploading..." : "Upload"}
                <input type="file" accept="image/*" onChange={onAvatar} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="label">Full Name *</label>
            <input required value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Phone</label>
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="input" placeholder="+91 86800 60912" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Email</label>
            <input value={profile.email} disabled className="input bg-gray-50 text-gray-500" />
            <p className="mt-1 text-xs text-gray-400">Email cannot be changed. Contact support if needed.</p>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="btn-primary">
              <Save className="mr-1.5 inline h-4 w-4" /> {busy ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-900">
          <KeyRound className="h-5 w-5 text-brand-600" /> Change Password
        </h2>
        <form onSubmit={changePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Current Password *</label>
            <input
              type="password"
              required
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              className="input"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="label">New Password *</label>
            <input
              type="password"
              required
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              className="input"
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input
              type="password"
              required
              value={pwd.confirm}
              onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
              className="input"
              autoComplete="new-password"
            />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pwBusy} className="btn-primary">
              {pwBusy ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}