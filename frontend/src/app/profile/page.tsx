'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api-client';
import { ProfileResponse } from '@/types/api';
import Image from 'next/image';
import Link from 'next/link';

// A component to render the main profile content
function ProfileContent() {
  const { user, logout } = useAuth(); // Assuming user object is now directly available
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    avatarUrl: user?.avatarUrl || '',
  });

  const fetchProfileDetails = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load profile details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, []);

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      avatarUrl: user?.avatarUrl || '',
    });
  };

  const handleSave = async () => {
    try {
      await apiClient.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        avatarUrl: formData.avatarUrl,
      });
      // Re-fetch all profile data to ensure consistency
      await fetchProfileDetails();
      setIsEditing(false);
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Failed to update profile.');
    }
  };

  const getInitials = () => {
    if (!user) return '??';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading full profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <span className="text-5xl">⚠️</span>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Error Loading Profile Details
          </h2>
          <p className="mt-2 text-gray-600">{error}</p>
          <button
            onClick={fetchProfileDetails}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
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
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Avatar URL"
                  value={formData.avatarUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, avatarUrl: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">
                  {user?.firstName} {user?.lastName}
                </h1>
                <p className="text-gray-600 mt-1">{user?.email}</p>
                {user?.emailVerified && (
                  <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Verified
                  </span>
                )}
              </>
            )}
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

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-500">Total Value</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">
            {formatCurrency(profileData.stats.totalValue)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-500">Total Return</h3>
          <p
            className={`text-3xl font-bold mt-2 ${
              profileData.stats.totalReturn >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {formatCurrency(profileData.stats.totalReturn)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-500">Return %</h3>
          <p
            className={`text-3xl font-bold mt-2 ${
              profileData.stats.returnPercentage >= 0
                ? 'text-green-600'
                : 'text-red-600'
            }`}
          >
            {profileData.stats.returnPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Portfolios Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Portfolios</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {profileData.portfolios.map((portfolio) => (
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
                            ? 'text-green-600'
                            : 'text-red-600'
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
      router.push('/login');
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