import api from './api';

export interface Prediction {
  id: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    league: string;
  };
  predictedWinner: string;
  confidence: number;
  status: 'pending' | 'correct' | 'incorrect';
  createdAt: string;
}

export interface PredictionAnalytics {
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  pendingPredictions: number;
  accuracyRate: number;
  averageConfidence: number;
  streakData: {
    currentStreak: number;
    bestStreak: number;
    isCurrentStreakPositive: boolean;
  };
  recentPerformance: {
    last10Accuracy: number;
    last30Accuracy: number;
  };
}

class PredictionService {
  async getPredictionHistory(): Promise<Prediction[]> {
    const response = await api.get('/predictions/history');
    return response.data;
  }

  async getActivePredictions(): Promise<Prediction[]> {
    const response = await api.get('/predictions/active');
    return response.data;
  }

  async getPredictionAnalytics(): Promise<PredictionAnalytics> {
    const response = await api.get('/predictions/analytics');
    return response.data;
  }

  async createPrediction(matchId: string): Promise<void> {
    await api.post('/predictions', { matchId });
  }
}

export const predictionService = new PredictionService(); 