"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { ProfileResponse } from "@/types/api";
import Link from "next/link";

export default function Profile() {
  const router = useRouter();
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfile();
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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="container space-y-6">
        {/* Header Section */}
        <div className="card">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div
              className="h-24 w-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--primary-hover))",
              }}
            >
              {getInitials()}
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
                  <button onClick={handleSave} className="btn-primary">
                    Save
                  </button>
                  <button onClick={handleCancel} className="btn-secondary">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={handleEdit} className="btn-secondary">
                  Edit Profile
                </button>
              )}
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
                profileData.stats.totalReturn >= 0
                  ? "text-success"
                  : "text-error"
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

        {/* Tabs */}
        <div className="card p-0">
          <div style={{ borderBottom: "1px solid var(--border)" }}>
            <nav className="flex -mb-px overflow-x-auto">
              {["portfolios", "activity", "stats", "settings"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-max py-4 px-6 text-center font-medium text-sm capitalize transition-colors`}
                  style={{
                    borderBottom:
                      activeTab === tab
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                    color:
                      activeTab === tab
                        ? "var(--primary)"
                        : "var(--text-secondary)",
                  }}
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
                    <p className="text-secondary text-sm">
                      Manage and track your investment portfolios
                    </p>
                  </div>
                  <Link href="/portfolios/create" className="btn-primary">
                    Create Portfolio
                  </Link>
                </div>

                {profileData.portfolios.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-semibold">No portfolios yet</h3>
                    <p className="text-secondary mt-2">
                      Create your first portfolio to start tracking your
                      investments
                    </p>
                    <Link
                      href="/portfolios/create"
                      className="btn-primary mt-6 inline-block"
                    >
                      Create Your First Portfolio
                    </Link>
                  </div>
                ) : (
                  <>
                    {profileData.portfolios.map((portfolio) => (
                      <div
                        key={portfolio.id}
                        className="card cursor-pointer"
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
                                <span className="badge badge-success">
                                  Default
                                </span>
                              )}
                            </div>
                            {portfolio.description && (
                              <p className="text-sm text-secondary mt-1">
                                {portfolio.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-secondary">
                              <span>
                                Value: {formatCurrency(portfolio.totalValue)}
                              </span>
                              <span>•</span>
                              <span>
                                Cost: {formatCurrency(portfolio.totalCost)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p
                              className={`text-lg font-bold ${
                                portfolio.totalReturn >= 0
                                  ? "text-success"
                                  : "text-error"
                              }`}
                            >
                              {portfolio.totalReturn >= 0 ? "+" : ""}
                              {formatCurrency(portfolio.totalReturn)}
                            </p>
                            <p
                              className={`text-sm ${
                                portfolio.returnPercentage >= 0
                                  ? "text-success"
                                  : "text-error"
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
                <h3 className="text-lg font-semibold">Activity Coming Soon</h3>
                <p className="text-secondary mt-2">
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
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      <p className="text-sm text-muted">Total Portfolios</p>
                      <p className="text-2xl font-bold">
                        {profileData.portfolios.length}
                      </p>
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: "var(--bg-tertiary)" }}
                    >
                      <p className="text-sm text-muted">Average Return</p>
                      <p
                        className={`text-2xl font-bold ${
                          profileData.stats.returnPercentage >= 0
                            ? "text-success"
                            : "text-error"
                        }`}
                      >
                        {profileData.stats.returnPercentage >= 0 ? "+" : ""}
                        {profileData.stats.returnPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>

                <hr />

                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    More Analytics Coming Soon
                  </h3>
                  <p className="text-secondary">
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
                    <div className="card">
                      <h3 className="font-semibold mb-2">Email Verification</h3>
                      <p className="text-sm text-secondary">
                        Status:{" "}
                        {profileData.user.emailVerified ? (
                          <span className="text-success font-medium">
                            Verified
                          </span>
                        ) : (
                          <span className="text-warning font-medium">
                            Not Verified
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="card">
                      <h3 className="font-semibold mb-2">Security</h3>
                      <button
                        className="text-sm font-medium"
                        style={{ color: "var(--primary)" }}
                      >
                        Change Password
                      </button>
                    </div>

                    <div
                      className="card"
                      style={{
                        borderColor: "var(--error)",
                        backgroundColor: "rgba(239, 68, 68, 0.05)",
                      }}
                    >
                      <h3 className="font-semibold text-error mb-2">
                        Danger Zone
                      </h3>
                      <button className="text-error text-sm font-medium">
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
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/portfolios/create"
              className="flex flex-col items-center justify-center p-6 rounded-lg transition-all"
              style={{ border: "2px solid var(--border)" }}
            >
              <span className="text-3xl mb-2">💼</span>
              <span className="text-sm font-medium">New Portfolio</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center p-6 rounded-lg transition-all"
              style={{ border: "2px solid var(--border)" }}
            >
              <span className="text-3xl mb-2">📊</span>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <button
              className="flex flex-col items-center justify-center p-6 rounded-lg transition-all"
              style={{ border: "2px solid var(--border)" }}
            >
              <span className="text-3xl mb-2">🎯</span>
              <span className="text-sm font-medium">Take Quiz</span>
            </button>
            <button
              className="flex flex-col items-center justify-center p-6 rounded-lg transition-all"
              style={{ border: "2px solid var(--border)" }}
            >
              <span className="text-3xl mb-2">📈</span>
              <span className="text-sm font-medium">Analytics</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
