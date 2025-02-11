import api from './api';

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
  stadium: string;
  hasPrediction: boolean;
}

export interface MatchDetails extends Match {
  weather?: {
    temperature: number;
    condition: string;
    precipitation: number;
  };
  headToHead?: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    lastFiveResults: Array<{
      date: string;
      homeScore: number;
      awayScore: number;
    }>;
  };
  prediction?: {
    predictedWinner: string;
    confidence: number;
    factors: Array<{
      name: string;
      impact: number;
    }>;
  };
}

class MatchService {
  async getUpcomingMatches(): Promise<Match[]> {
    const response = await api.get('/matches/upcoming');
    return response.data;
  }

  async getMatchDetails(matchId: string): Promise<MatchDetails> {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  }
}

export const matchService = new MatchService(); 