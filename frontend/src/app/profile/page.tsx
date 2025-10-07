"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import { ProfileResponse } from "@/types/api";
import Link from "next/link";

// A component to render the main profile content
function ProfileContent() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
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
      bio: "",
    });
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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div className="spinner"></div>
          <p className="text-muted" style={{ marginTop: "16px" }}>
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="card" style={{ maxWidth: "448px" }}>
          <div style={{ textAlign: "center" }}>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "16px",
              }}
            >
              Error Loading Profile
            </h2>
            <p className="text-secondary" style={{ marginBottom: "24px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Section */}
      <div className="card">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                height: "96px",
                width: "96px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "1.5rem",
                fontWeight: "bold",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              {getInitials()}
            </div>
          </div>

          {/* User Info */}
          <div style={{ flex: 1, textAlign: "center", width: "100%" }}>
            {isEditing ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "16px",
                  }}
                >
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
                <h1 style={{ fontSize: "1.875rem", fontWeight: "bold" }}>
                  {profileData.user.firstName} {profileData.user.lastName}
                </h1>
                <p className="text-secondary" style={{ marginTop: "4px" }}>
                  {formData.bio || "No bio yet. Click edit to add one!"}
                </p>
                {profileData.user.emailVerified && (
                  <span
                    className="badge badge-success"
                    style={{ marginTop: "8px" }}
                  >
                    Verified
                  </span>
                )}
              </>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "center",
                gap: "16px",
                marginTop: "16px",
                fontSize: "0.875rem",
              }}
              className="text-secondary"
            >
              <span>{profileData.user.email}</span>
              <span>•</span>
              <span>Joined {formatDate(profileData.user.createdAt)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "8px" }}>
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
            <button
              onClick={logout}
              className="bg-error"
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "16px",
        }}
      >
        <div className="card">
          <p className="text-sm text-muted" style={{ fontSize: "0.875rem" }}>
            Total Portfolio Value
          </p>
          <p
            style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "4px" }}
          >
            {formatCurrency(profileData.stats.totalValue)}
          </p>
        </div>

        <div className="card">
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Total Return
          </p>
          <p
            className={
              profileData.stats.totalReturn >= 0 ? "text-success" : "text-error"
            }
            style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "4px" }}
          >
            {profileData.stats.totalReturn >= 0 ? "+" : ""}
            {formatCurrency(profileData.stats.totalReturn)}
          </p>
          <p
            className={
              profileData.stats.returnPercentage >= 0
                ? "text-success"
                : "text-error"
            }
            style={{ fontSize: "0.875rem" }}
          >
            {profileData.stats.returnPercentage >= 0 ? "+" : ""}
            {profileData.stats.returnPercentage.toFixed(2)}%
          </p>
        </div>

        <div className="card">
          <p className="text-muted" style={{ fontSize: "0.875rem" }}>
            Active Portfolios
          </p>
          <p
            style={{ fontSize: "1.5rem", fontWeight: "bold", marginTop: "4px" }}
          >
            {profileData.portfolios.length}
          </p>
        </div>
      </div>

      {/* Portfolios Section */}
      <div>
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "16px",
          }}
        >
          Portfolios
        </h2>
        <div className="card" style={{ padding: 0 }}>
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
            }}
          >
            {profileData.portfolios.map((portfolio, index) => (
              <li
                key={portfolio.id}
                style={{
                  padding: "24px",
                  borderBottom:
                    index < profileData.portfolios.length - 1
                      ? "1px solid var(--border)"
                      : "none",
                  transition: "background-color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "var(--bg-tertiary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <Link
                  href={`/portfolios/${portfolio.id}`}
                  style={{ display: "block", textDecoration: "none" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "16px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 600,
                          color: "var(--primary)",
                          marginBottom: "4px",
                        }}
                      >
                        {portfolio.name}
                      </p>
                      <p
                        className="text-muted"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {portfolio.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                        {formatCurrency(portfolio.totalValue)}
                      </p>
                      <p
                        className={
                          portfolio.totalReturn >= 0
                            ? "text-success"
                            : "text-error"
                        }
                        style={{ fontSize: "0.875rem" }}
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
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px 16px",
      }}
    >
      <div className="container">
        <ProfileContent />
      </div>
    </div>
  );
}
