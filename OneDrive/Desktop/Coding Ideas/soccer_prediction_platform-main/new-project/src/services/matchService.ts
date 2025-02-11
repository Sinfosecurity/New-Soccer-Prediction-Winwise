import api from './api';

export interface Match {
  id: number;
  home_team: string;
  away_team: string;
  competition: string;
  start_time: string;
  status: string;
  home_score?: number;
  away_score?: number;
  prediction?: string;
  confidence?: number;
  odds_data?: Record<string, any>;
}

export const matchService = {
  getUpcomingMatches: async (): Promise<Match[]> => {
    try {
      const response = await api.get<Match[]>('/api/v1/matches/upcoming');
      return response.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch upcoming matches: ${error.message}`);
      }
      throw new Error('Failed to fetch upcoming matches: An unexpected error occurred');
    }
  },
};

export default matchService; 