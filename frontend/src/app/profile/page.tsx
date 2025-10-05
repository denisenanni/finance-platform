"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { ProfileResponse } from "@/types/api";
import Image from "next/image";
import Link from "next/link";

// A component to render the main profile content
function ProfileContent() {
  const { user, logout } = useAuth(); // Assuming user object is now directly available
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    avatarUrl: user?.avatarUrl || "",
    bio: "",
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load profile details"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      avatarUrl: user?.avatarUrl || "",
      bio: "",
    });
  };

  const handleSave = async () => {
    try {
      await apiClient.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        // avatarUrl omitted to match expected API shape
      });
      // Re-fetch all profile data to ensure consistency
      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile.");
    }
  };

  const getInitials = () => {
    if (!user) return "??";
    return `${user.firstName?.[0] || ""}${
      user.lastName?.[0] || ""
    }`.toUpperCase();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  const formatDate = (value: string | Date) =>
    new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner"></div>
          <p className="mt-4 text-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4">Error Loading Profile</h2>
            <p className="text-secondary mb-6">
              {error || "Failed to load profile data"}
            </p>
            <button onClick={() => fetchProfile()} className="btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Profile JSX
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="relative">
            {user?.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt="Avatar"
                width={96}
                height={96}
                className="rounded-full shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {getInitials()}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label>First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label>Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label>Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    placeholder="Tell us about your investment journey..."
                  />
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold">
                  {profileData.user.firstName} {profileData.user.lastName}
                </h1>
                <p className="text-secondary mt-1">
                  {formData.bio || "No bio yet. Click edit to add one!"}
                </p>
                {profileData.user.emailVerified && (
                  <span className="badge badge-success mt-2">Verified</span>
                )}
              </>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm text-secondary">
              <span>{profileData.user.email}</span>
              <span>•</span>
              <span>Joined {formatDate(profileData.user.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 rounded-md"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-gray-200 rounded-md"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 text-white rounded-md"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-muted">Total Portfolio Value</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(profileData.stats.totalValue)}
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-muted">Total Return</p>
          <p
            className={`text-2xl font-bold mt-1 ${
              profileData.stats.totalReturn >= 0 ? "text-success" : "text-error"
            }`}
          >
            {profileData.stats.totalReturn >= 0 ? "+" : ""}
            {formatCurrency(profileData.stats.totalReturn)}
          </p>
          <p
            className={`text-sm ${
              profileData.stats.returnPercentage >= 0
                ? "text-success"
                : "text-error"
            }`}
          >
            {profileData.stats.returnPercentage >= 0 ? "+" : ""}
            {profileData.stats.returnPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="card">
          <p className="text-sm text-muted">Active Portfolios</p>
          <p className="text-2xl font-bold mt-1">
            {profileData.portfolios.length}
          </p>
        </div>
      </div>

      {/* Portfolios Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolios</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {profileData!.portfolios.map((portfolio) => (
              <li key={portfolio.id} className="p-6 hover:bg-gray-50">
                <Link href={`/portfolios/${portfolio.id}`} className="block">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-semibold text-blue-600">
                        {portfolio.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {portfolio.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatCurrency(portfolio.totalValue)}
                      </p>
                      <p
                        className={`text-sm ${
                          portfolio.totalReturn >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(portfolio.totalReturn)} (
                        {portfolio.returnPercentage.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// A wrapper component to handle auth state
export default function ProfilePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    // Show a loading spinner or a blank page while redirecting
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // User is authenticated, render the main content
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <ProfileContent />
      </div>
    </div>
  );
}
