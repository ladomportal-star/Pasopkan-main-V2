/** Reviews require authenticated server-backed storage; no local/demo records are served. */
export interface Review {
  id: string;
  eventId: string;
  userName: string;
  userRealName?: string;
  rating: number;
  comment: { en: string; lo: string } | string;
  date: string;
  avatarUrl?: string;
}

export function getReviewsForEvent(_eventId: string): Review[] {
  return [];
}

export function getUserReviewForEvent(_eventId: string, _userName: string): Review | null {
  return null;
}

export function getAverageRatingForEvent(_eventId: string): { average: number; count: number } {
  return { average: 0, count: 0 };
}
