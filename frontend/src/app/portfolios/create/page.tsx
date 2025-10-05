// frontend/src/app/portfolios/create/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function CreatePortfolio() {
  const router = useRouter();

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="container max-w-2xl">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push("../profile")}
            className="text-sm text-secondary hover:text-primary transition-colors"
          >
            ← Back to Profile
          </button>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Portfolio</h1>
          <p className="text-secondary mt-2">
            Set up a new portfolio to track your investments
          </p>
        </div>

        {/* Form will go here */}
        <div className="card">
          <p className="text-center text-secondary py-12">
            Portfolio creation form coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
