const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 72],
    "scope-enum": [
      2,
      "always",
      [
        "auth",
        "db",
        "prisma",
        "search",
        "tmdb",
        "anilist",
        "library",
        "watchlist",
        "history",
        "tracking",
        "progress",
        "stats",
        "ui",
        "export",
        "deps",
        "config",
        "ci",
        "docs",
      ],
    ],
  },
};

export default config;
