export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin", "/admin-ai", "/api/"] }
    ],
    sitemap: "https://migamart.com/sitemap.xml",
    host: "https://migamart.com"
  };
}
