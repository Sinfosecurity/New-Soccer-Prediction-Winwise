import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, type DashboardStats } from '../services/dashboardService';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchDashboardData();
    }
  }, [isAuthenticated, user]);

  if (!isAuthenticated || !user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="warning">
          <AlertIcon />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please log in to view the dashboard.</AlertDescription>
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading dashboard data...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button mt={4} onClick={fetchDashboardData}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>No dashboard data is currently available.</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const chartData = {
    labels: stats.prediction_history.map((item) => format(new Date(item.date), 'MMM d')),
    datasets: [
      {
        label: 'Prediction Accuracy',
        data: stats.prediction_history.map((item) => item.accuracy * 100),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Prediction Accuracy Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Accuracy (%)',
        },
      },
    },
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Dashboard</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Total Predictions</StatLabel>
              <StatNumber>{stats.total_predictions}</StatNumber>
              <StatHelpText>All-time predictions made</StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Accuracy Rate</StatLabel>
              <StatNumber>{(stats.accuracy_rate * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>Based on completed predictions</StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Upcoming Matches</StatLabel>
              <StatNumber>{stats.upcoming_matches}</StatNumber>
              <StatHelpText>Next 24 hours</StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Active Bets</StatLabel>
              <StatNumber>{stats.active_bets}</StatNumber>
              <StatHelpText>Currently open positions</StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>Prediction Accuracy Trend</Heading>
          <Box height="300px">
            <Line data={chartData} options={chartOptions} />
          </Box>
        </Box>

        <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>Upcoming Matches</Heading>
          {stats.recent_predictions.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Match</Th>
                  <Th>Competition</Th>
                  <Th>Time</Th>
                  <Th>Prediction</Th>
                  <Th>Confidence</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.recent_predictions.map((match) => (
                  <Tr key={match.id}>
                    <Td>{match.home_team} vs {match.away_team}</Td>
                    <Td>{match.competition}</Td>
                    <Td>{format(new Date(match.match_time), 'MMM d, HH:mm')}</Td>
                    <Td>
                      {match.prediction ? (
                        <Badge colorScheme={
                          match.prediction === 'home_win' ? 'green' :
                          match.prediction === 'away_win' ? 'red' : 'yellow'
                        }>
                          {match.prediction.replace('_', ' ').toUpperCase()}
                        </Badge>
                      ) : (
                        'Pending'
                      )}
                    </Td>
                    <Td>
                      {match.confidence ? `${(match.confidence * 100).toFixed(0)}%` : '-'}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text>No upcoming matches available</Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default Dashboard; 