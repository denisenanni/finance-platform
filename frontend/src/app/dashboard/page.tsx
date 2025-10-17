"use client";

import React from "react";
import { NewsFeedWidget } from "./NewsFeedWidget";

const DashboardPage = () => {
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
          </div>

          {/* You can add more content here */}
          <NewsFeedWidget />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
