"use client";
import { useAssets } from "@/lib/api";

export default function AnalyticsPage() {
  const { data: assetsData } = useAssets();
  console.log({ assetsData });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Section */}
      <div className="card"></div>
    </div>
  );
}
