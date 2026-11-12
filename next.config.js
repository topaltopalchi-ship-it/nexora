/** @type {import("next").NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGithubActions ? "/nexora" : "",
  images: { unoptimized: true },
};

module.exports = nextConfig;
