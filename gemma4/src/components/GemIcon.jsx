import React from "react";

export default function GemIcon({ thinking = false, size = 26 }) {
  return (
    <svg className={`gw-gem${thinking ? " thinking" : ""}`} width={size} height={size} viewBox="0 0 100 100">
      <polygon points="50,4 90,28 50,50" fill="#4F7CFF" />
      <polygon points="50,4 10,28 50,50" fill="#7C9CFF" />
      <polygon points="10,28 50,50 50,96" fill="#B084F0" />
      <polygon points="90,28 50,50 50,96" fill="#35D499" />
    </svg>
  );
}
