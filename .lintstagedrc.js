module.exports = {
  "*.{js,jsx,ts,tsx,json,css,md}": ["pnpm run format"],
  "*.{js,jsx,ts,tsx}": () => "pnpm run lint",
};
