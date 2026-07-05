import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b1120",
        }}
      >
        <svg
          width="126"
          height="126"
          viewBox="0 0 1000 1000"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#2dd4bf"
            d="m340.97 532.67l-123.23 134.49c-2.47 2.69-2.29 6.87 0.4 9.34l134.49 123.23 139.37 127.71 127.7-139.37-139.36-127.7z"
          />
          <path
            fill="#2dd4bf"
            d="m494.32 365.32l-139.37-127.7-123.23 134.49c-2.47 2.69-2.29 6.87 0.41 9.34l134.48 123.23 139.37 127.71 139.36 127.7 123.24-134.49c2.46-2.69 2.28-6.87-0.41-9.34l-134.49-123.24z"
          />
          <path
            fill="#2dd4bf"
            d="m659.32 465.04l123.24-134.49c2.47-2.69 2.28-6.87-0.41-9.34l-134.49-123.24-134.49-123.23c-2.69-2.47-6.87-2.29-9.34 0.4l-123.23 134.49 139.36 127.71z"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
