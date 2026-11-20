import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: ['/', '/how-scoring-works', '/privacy'], disallow: ['/learn/', '/learners/', '/classrooms/', '/api/'] }] };
}
