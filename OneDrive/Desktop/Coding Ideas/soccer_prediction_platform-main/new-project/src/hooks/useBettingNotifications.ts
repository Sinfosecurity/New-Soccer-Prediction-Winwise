import { useNotifications } from '../contexts/NotificationContext';

export const useBettingNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyMatchStart = (match: string) => {
    addNotification({
      title: 'Match Starting Soon',
      message: `${match} is about to begin in 15 minutes`,
      type: 'info',
      duration: 10000,
    });
  };

  const notifyValueBetOpportunity = (match: string, odds: number, prediction: string) => {
    addNotification({
      title: 'Value Bet Opportunity',
      message: `${match}: ${prediction} @ ${odds}. Our model suggests this is undervalued.`,
      type: 'success',
      duration: 15000,
    });
  };

  const notifyOddsMovement = (match: string, market: string, oldOdds: number, newOdds: number) => {
    const movement = newOdds > oldOdds ? 'increased' : 'decreased';
    addNotification({
      title: 'Significant Odds Movement',
      message: `${match}: ${market} odds have ${movement} from ${oldOdds} to ${newOdds}`,
      type: 'warning',
      duration: 8000,
    });
  };

  const notifyBetResult = (match: string, betType: string, result: 'won' | 'lost', profit?: number) => {
    addNotification({
      title: `Bet ${result.toUpperCase()}`,
      message: `${match} - ${betType}: ${result === 'won' ? `Won $${profit}` : 'Lost'}`,
      type: result === 'won' ? 'success' : 'error',
      duration: 12000,
    });
  };

  const notifyHighRiskOpportunity = (match: string, reason: string) => {
    addNotification({
      title: 'High Risk Opportunity',
      message: `${match}: ${reason}`,
      type: 'warning',
      duration: 10000,
    });
  };

  return {
    notifyMatchStart,
    notifyValueBetOpportunity,
    notifyOddsMovement,
    notifyBetResult,
    notifyHighRiskOpportunity,
  };
}; 