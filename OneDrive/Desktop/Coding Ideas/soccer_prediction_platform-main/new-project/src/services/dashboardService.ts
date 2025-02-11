import { api } from './api';

interface DetailedStats {
  profit_loss: number;
  roi: number;
  win_streak: number;
  loss_streak: number;
  average_odds: number;
  value_bets_won: number;
  value_bets_total: number;
}

interface LeaguePerformance {
  league_name: string;
  accuracy: number;
  total_bets: number;
  profit_loss: number;
}

interface PredictionHistoryItem {
  date: string;
  accuracy: number | null;
  correct: number;
  total: number;
}

interface StatsSummary {
  total_pending: number;
  total_correct: number;
  current_streak: number;
}

interface RecentPrediction {
  id: string;
  home_team: string;
  away_team: string;
  competition: string;
  match_time: string;
  prediction: string | null;
  confidence: number | null;
  status: 'pending' | 'won' | 'lost' | 'void' | 'scheduled' | 'in_progress';
}

export interface DashboardFilters {
  search?: string;
  competition?: string;
  sortBy: 'date' | 'competition' | 'confidence';
  sortOrder: 'asc' | 'desc';
}

export interface DashboardStats {
  total_predictions: number;
  accuracy_rate: number;
  upcoming_matches: number;
  active_bets: number;
  prediction_history: PredictionHistoryItem[];
  stats_summary: StatsSummary;
  recent_predictions: RecentPrediction[];
  available_competitions: string[];
  detailed_stats: DetailedStats;
  league_performance: LeaguePerformance[];
  prediction_distribution: Record<string, number>;
}

class DashboardService {
  async getStats(filters?: DashboardFilters): Promise<DashboardStats> {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('User is not authenticated');
      }

      console.log('Fetching dashboard stats with filters:', filters);
      const response: AxiosResponse<DashboardStats> = await api.get('/api/v1/dashboard/stats', {
        params: filters
      });
      console.log('Dashboard stats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          throw new Error('Please log in to view dashboard data');
        }
        if (error.message.includes('403')) {
          throw new Error('You do not have permission to view this data');
        }
        if (error.message.includes('Network Error')) {
          throw new Error('Unable to connect to the server. Please check your internet connection');
        }
        throw new Error(`Failed to load dashboard data: ${error.message}`);
      }
      throw new Error('Failed to load dashboard data: An unexpected error occurred');
    }
  }

  async getCompetitions(): Promise<string[]> {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('User is not authenticated');
      }

      const response: AxiosResponse<string[]> = await api.get('/api/v1/competitions');
      return response.data;
    } catch (error) {
      console.error('Error fetching competitions:', error);
      throw new Error('Failed to load competitions');
    }
  }
}

export const dashboardService = new DashboardService(); 