import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { predictionService } from '../services/prediction';

interface Analytics {
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

const PredictionAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await predictionService.getPredictionAnalytics();
        setAnalytics(data);
      } catch (err) {
        setError('Failed to load prediction analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <Box>
      <Heading size="lg" mb={6}>Prediction Analytics</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {/* Overall Stats */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={4}>
            <Heading size="md">Overall Performance</Heading>
            <Stat>
              <StatLabel>Total Predictions</StatLabel>
              <StatNumber>{analytics.totalPredictions}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Accuracy Rate</StatLabel>
              <StatNumber>{(analytics.accuracyRate * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>
                {analytics.correctPredictions} correct, {analytics.incorrectPredictions} incorrect
              </StatHelpText>
            </Stat>
          </VStack>
        </Box>

        {/* Streak Data */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={4}>
            <Heading size="md">Streaks</Heading>
            <Stat>
              <StatLabel>Current Streak</StatLabel>
              <StatNumber>
                {analytics.streakData.currentStreak}{' '}
                {analytics.streakData.isCurrentStreakPositive ? 'Correct' : 'Incorrect'}
              </StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Best Streak</StatLabel>
              <StatNumber>{analytics.streakData.bestStreak} Correct</StatNumber>
            </Stat>
          </VStack>
        </Box>

        {/* Recent Performance */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={4}>
            <Heading size="md">Recent Performance</Heading>
            <Stat>
              <StatLabel>Last 10 Predictions</StatLabel>
              <StatNumber>{(analytics.recentPerformance.last10Accuracy * 100).toFixed(1)}%</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Last 30 Predictions</StatLabel>
              <StatNumber>{(analytics.recentPerformance.last30Accuracy * 100).toFixed(1)}%</StatNumber>
            </Stat>
          </VStack>
        </Box>

        {/* Confidence Analysis */}
        <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
          <VStack align="start" spacing={4}>
            <Heading size="md">Confidence Analysis</Heading>
            <Stat>
              <StatLabel>Average Confidence</StatLabel>
              <StatNumber>{(analytics.averageConfidence * 100).toFixed(1)}%</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Pending Predictions</StatLabel>
              <StatNumber>{analytics.pendingPredictions}</StatNumber>
            </Stat>
          </VStack>
        </Box>
      </SimpleGrid>
    </Box>
  );
};

export default PredictionAnalytics; 