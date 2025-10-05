import React from "react";

const Footer = () => {
  return (
    <footer
      className="p-4 text-center"
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-secondary)",
      }}
    >
      <p className="text-sm text-muted">
        © 2024 Your Company. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
