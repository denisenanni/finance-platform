"use client";

import { useNewsList } from "@/lib/api";
import React from "react";

const DashboardPage = () => {
  const { data } = useNewsList();
  console.log({ data });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="card">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Header */}
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Dashboard
            </h1>
            <p className="text-secondary" style={{ fontSize: "0.875rem" }}>
              Welcome to your dashboard!
            </p>
          </div>

          {/* You can add more content here */}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
