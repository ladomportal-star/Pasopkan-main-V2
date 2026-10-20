/** Blog content is intentionally empty until a server-backed CMS is available. */
export interface BlogPost {
  id: string;
  title: string;
  titleLao?: string;
  slug: string;
  excerpt: string;
  excerptLao?: string;
  content: string;
  contentLao?: string;
  coverImage: string;
  author: { name: string; role?: string; avatar?: string };
  publishedAt: string;
  updatedAt?: string;
  isPublished: boolean;
  featured?: boolean;
  tags?: string[];
}

export function getBlogs(): BlogPost[] {
  return [];
}
