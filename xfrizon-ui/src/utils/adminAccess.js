const ROLE_PERMISSIONS = {
  ADMIN: ["*"],
  BLOG_WRITER: [
    "admin.blogs.view",
    "admin.blogs.manage",
    "admin.blog_hero.manage",
  ],
};

const ROUTE_PERMISSIONS = [
  { path: "/admin/dashboard", permission: "admin.dashboard.view" },
  { path: "/admin/blogs", permission: "admin.blogs.view" },
  { path: "/admin/blog-hero-blocks", permission: "admin.blog_hero.manage" },
  { path: "/admin/users", permission: "admin.users.view" },
  { path: "/admin/organizers", permission: "admin.organizers.view" },
  { path: "/admin/home-blocks", permission: "admin.home_blocks.manage" },
  { path: "/admin/messages", permission: "admin.messages.view" },
  { path: "/admin/payouts", permission: "admin.payouts.view" },
  { path: "/admin/partners", permission: "admin.partners.view" },
];

const ROLE_ALIAS = {
  CONTENT_WRITER: "BLOG_WRITER",
  WRITER: "BLOG_WRITER",
  BLOG_EDITOR: "BLOG_WRITER",
};

const normalizeTokenList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((token) => String(token).trim().toUpperCase()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean);
};

export const normalizeRole = (role) => {
  const normalized = String(role || "").trim().toUpperCase();
  return ROLE_ALIAS[normalized] || normalized;
};

export const getUserRoles = (adminUser) => {
  const tokens = new Set([
    ...normalizeTokenList(adminUser?.role),
    ...normalizeTokenList(adminUser?.roles),
  ]);
  return [...tokens].map(normalizeRole).filter(Boolean);
};

export const getUserPermissions = (adminUser) => {
  const directPermissions = normalizeTokenList(adminUser?.permissions).map((p) =>
    p.toLowerCase(),
  );

  const inherited = getUserRoles(adminUser).flatMap((role) => ROLE_PERMISSIONS[role] || []);

  const all = new Set([...inherited, ...directPermissions]);
  return [...all];
};

export const hasPermission = (adminUser, permission) => {
  if (!permission) return true;
  const permissions = getUserPermissions(adminUser);
  return permissions.includes("*") || permissions.includes(permission);
};

export const getRoutePermission = (pathname) => {
  const entry = ROUTE_PERMISSIONS.find((item) => pathname.startsWith(item.path));
  return entry?.permission || null;
};

export const canAccessRoute = (adminUser, pathname) => {
  const permission = getRoutePermission(pathname);
  return hasPermission(adminUser, permission);
};

export const getDefaultAdminPath = (adminUser) => {
  const candidates = [
    "/admin/dashboard",
    "/admin/blogs",
    "/admin/blog-hero-blocks",
    "/admin/users",
  ];
  const firstAllowed = candidates.find((path) => canAccessRoute(adminUser, path));
  return firstAllowed || "/admin-login";
};

export const hasAdminDashboardAccess = (adminUser) =>
  getDefaultAdminPath(adminUser) !== "/admin-login";
