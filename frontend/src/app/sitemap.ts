import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = ['', '/login', '/register'];

  const routes = publicRoutes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    priority: route === '' ? 1 : 0.8,
    changeFrequency: 'monthly' as const,
  }));

  return routes;
}