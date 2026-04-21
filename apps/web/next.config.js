/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@wisdom-journal/shared"],
  async headers() {
    return [
      {
        // Service worker script must never be cached by the browser,
        // otherwise old workers can't be replaced for minutes/hours.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
          { key: "Pragma", value: "no-cache" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
