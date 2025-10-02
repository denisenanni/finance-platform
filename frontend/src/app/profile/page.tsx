"use client";

import { Link } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { ProfileResponse } from "@/types/api";

export default function Profile() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("portfolios");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    bio: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchProfile();
    }
  }, [status, router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfile(); // Much cleaner!
      setProfileData(data);
      setFormData({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        bio: "",
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    if (profileData) {
      setFormData({
        firstName: profileData.user.firstName,
        lastName: profileData.user.lastName,
        bio: "",
      });
    }
  };

  const handleSave = async () => {
    try {
      // Use apiClient's updateProfile method
      await apiClient.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      await fetchProfile();
      setIsEditing(false);
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile");
    }
  };

  const getInitials = () => {
    if (!profileData) return "??";
    return `${profileData.user.firstName[0]}${profileData.user.lastName[0]}`;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <span className="text-5xl">⚠️</span>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Error Loading Profile
            </h2>
            <p className="mt-2 text-gray-600">
              {error || "Failed to load profile data"}
            </p>
            <button
              onClick={() => fetchProfile()}
              className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {getInitials()}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      placeholder="Tell us about your investment journey..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profileData.user.firstName} {profileData.user.lastName}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {formData.bio || "No bio yet. Click edit to add one!"}
                  </p>
                  {profileData.user.emailVerified && (
                    <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Verified
                    </span>
                  )}
                </>
              )}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>{profileData.user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Joined {formatDate(profileData.user.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    ✖️ Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors flex items-center gap-2"
                >
                  ✏️ Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Portfolio Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(profileData.stats.totalValue)}
                </p>
              </div>
              <span className="text-4xl">💵</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Return</p>
                <p
                  className={`text-2xl font-bold ${
                    profileData.stats.totalReturn >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {profileData.stats.totalReturn >= 0 ? "+" : ""}
                  {formatCurrency(profileData.stats.totalReturn)}
                </p>
                <p
                  className={`text-sm ${
                    profileData.stats.returnPercentage >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {profileData.stats.returnPercentage >= 0 ? "+" : ""}
                  {profileData.stats.returnPercentage.toFixed(2)}%
                </p>
              </div>
              <span className="text-4xl">
                {profileData.stats.totalReturn >= 0 ? "📈" : "📉"}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Portfolios</p>
                <p className="text-2xl font-bold">
                  {profileData.portfolios.length}
                </p>
              </div>
              <span className="text-4xl">💼</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              {["portfolios", "activity", "stats", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-max py-4 px-6 text-center border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Portfolios Tab */}
            {activeTab === "portfolios" && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl font-bold">My Portfolios</h2>
                    <p className="text-gray-600 text-sm">
                      Manage and track your investment portfolios
                    </p>
                  </div>
                  <Link
                    href="/portfolios/create"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    + Create Portfolio
                  </Link>
                </div>

                {profileData.portfolios.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-6xl">📊</span>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">
                      No portfolios yet
                    </h3>
                    <p className="mt-2 text-gray-600">
                      Create your first portfolio to start tracking your
                      investments
                    </p>
                    <Link
                      href="/portfolios/create"
                      className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Create Your First Portfolio
                    </Link>
                  </div>
                ) : (
                  <>
                    {profileData.portfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() =>
                          router.push(`/portfolios/${portfolio.id}`)
                        }
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold">
                                {portfolio.name}
                              </h3>
                              {portfolio.isDefault && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            {portfolio.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {portfolio.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <span>
                                Value: {formatCurrency(portfolio.totalValue)}
                              </span>
                              <span>•</span>
                              <span>
                                Cost: {formatCurrency(portfolio.totalCost)}
                              </span>
                              <span>•</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className={`text-lg font-bold ${
                                portfolio.totalReturn >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {portfolio.totalReturn >= 0 ? "+" : ""}
                              {formatCurrency(portfolio.totalReturn)}
                            </p>
                            <p
                              className={`text-sm ${
                                portfolio.returnPercentage >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {portfolio.returnPercentage >= 0 ? "+" : ""}
                              {portfolio.returnPercentage.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === "activity" && (
              <div className="text-center py-12">
                <span className="text-6xl">📊</span>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  Activity Coming Soon
                </h3>
                <p className="mt-2 text-gray-600">
                  Track your trades, achievements, and portfolio changes
                </p>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === "stats" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Performance Metrics
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Portfolios</p>
                      <p className="text-2xl font-bold">
                        {profileData.portfolios.length}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Average Return</p>
                      <p
                        className={`text-2xl font-bold ${
                          profileData.stats.returnPercentage >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {profileData.stats.returnPercentage >= 0 ? "+" : ""}
                        {profileData.stats.returnPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">
                    More Analytics Coming Soon
                  </h3>
                  <p className="text-gray-600">
                    Advanced metrics like Sharpe ratio, volatility, and risk
                    analysis will be available in future updates.
                  </p>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">Account Settings</h2>
                  <div className="space-y-4">
                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold mb-2">Email Verification</h3>
                      <p className="text-sm text-gray-600">
                        Status:{" "}
                        {profileData.user.emailVerified ? (
                          <span className="text-green-600 font-medium">
                            ✓ Verified
                          </span>
                        ) : (
                          <span className="text-yellow-600 font-medium">
                            ⚠ Not Verified
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold mb-2">Security</h3>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        Change Password
                      </button>
                    </div>

                    <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                      <h3 className="font-semibold text-red-900 mb-2">
                        Danger Zone
                      </h3>
                      <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/portfolios/create"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">💼</span>
              <span className="text-sm font-medium">New Portfolio</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <span className="text-3xl mb-2">📊</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <button className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-3xl mb-2">🎯</span>
              <span className="text-sm font-medium">Take Quiz</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <span className="text-3xl mb-2">📈</span>
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
