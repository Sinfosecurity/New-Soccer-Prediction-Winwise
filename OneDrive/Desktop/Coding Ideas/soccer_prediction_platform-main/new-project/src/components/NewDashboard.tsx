import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  HStack,
  Input,
  Select,
  IconButton,
  Tooltip,
  InputGroup,
  InputLeftElement,
  Icon,
} from '@chakra-ui/react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
} from 'chart.js';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, type DashboardStats, type DashboardFilters } from '../services/dashboardService';
import { RepeatIcon, SearchIcon, ChevronUpIcon, ChevronDownIcon } from '@chakra-ui/icons';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend
);

const POLLING_INTERVAL = 30000; // 30 seconds

const NewDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'competition' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const pollingInterval = useRef<NodeJS.Timeout>();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const fetchDashboardData = useCallback(async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      }
      const filters: DashboardFilters = {
        search: searchQuery,
        competition: selectedCompetition || undefined,
        sortBy,
        sortOrder,
      };
      const data = await dashboardService.getStats(filters);
      setStats(data);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCompetition, sortBy, sortOrder]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
      // Set up polling
      pollingInterval.current = setInterval(() => {
        fetchDashboardData();
      }, POLLING_INTERVAL);
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [isAuthenticated, fetchDashboardData]);

  const handleStatCardClick = (route: string) => {
    navigate(route);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleCompetitionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCompetition(event.target.value);
  };

  const handleSort = (field: 'date' | 'competition' | 'confidence') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <Spinner size="xl" />
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container maxW="container.xl" py={8} centerContent>
        <Text color="red.500">{error || 'Failed to load dashboard'}</Text>
      </Container>
    );
  }

  // Filter out days with no predictions and prepare chart data
  const validPredictionHistory = stats.prediction_history.filter(day => day.accuracy !== null);
  const chartData = {
    labels: validPredictionHistory.map(item => format(new Date(item.date), 'MMM d')),
    datasets: [
      {
        label: 'Prediction Accuracy',
        data: validPredictionHistory.map(item => (item.accuracy || 0) * 100),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        pointRadius: 4,
        pointHoverRadius: 6,
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
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const day = validPredictionHistory[index];
            return [
              `Accuracy: ${context.parsed.y.toFixed(1)}%`,
              `Correct: ${day.correct}/${day.total} predictions`,
            ];
          },
        },
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
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading>Dashboard</Heading>
          <Button
            leftIcon={<RepeatIcon />}
            onClick={handleRefresh}
            isLoading={refreshing}
            loadingText="Refreshing"
            size="sm"
          >
            Refresh
          </Button>
        </HStack>
        
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box 
            p={6} 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg" 
            shadow="sm"
            cursor="pointer"
            onClick={() => handleStatCardClick('/predictions/history')}
            _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
          >
            <Stat>
              <StatLabel>Total Predictions</StatLabel>
              <StatNumber>{stats.total_predictions}</StatNumber>
              <StatHelpText>
                {stats.stats_summary.total_pending} pending
              </StatHelpText>
            </Stat>
          </Box>

          <Box 
            p={6} 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg" 
            shadow="sm"
            cursor="pointer"
            onClick={() => handleStatCardClick('/predictions/analytics')}
            _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
          >
            <Stat>
              <StatLabel>Accuracy Rate</StatLabel>
              <StatNumber>{(stats.accuracy_rate * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>
                {stats.stats_summary.total_correct} correct predictions
              </StatHelpText>
            </Stat>
          </Box>

          <Box 
            p={6} 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg" 
            shadow="sm"
            cursor="pointer"
            onClick={() => handleStatCardClick('/matches/upcoming')}
            _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
          >
            <Stat>
              <StatLabel>Upcoming Matches</StatLabel>
              <StatNumber>{stats.upcoming_matches}</StatNumber>
              <StatHelpText>Next 24 hours</StatHelpText>
            </Stat>
          </Box>

          <Box 
            p={6} 
            bg={bgColor} 
            borderWidth="1px" 
            borderColor={borderColor} 
            borderRadius="lg" 
            shadow="sm"
            cursor="pointer"
            onClick={() => handleStatCardClick('/predictions/active')}
            _hover={{ transform: 'scale(1.02)', transition: 'transform 0.2s' }}
          >
            <Stat>
              <StatLabel>Active Predictions</StatLabel>
              <StatNumber>{stats.active_bets}</StatNumber>
              <StatHelpText>
                Streak: {stats.stats_summary.current_streak} wins
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
          <Box height="400px">
            <Line data={chartData} options={chartOptions} />
          </Box>
        </Box>

        <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Recent Predictions</Heading>
            <HStack spacing={4}>
              <InputGroup size="sm" width="200px">
                <InputLeftElement>
                  <Icon as={SearchIcon} color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Search matches..."
                  value={searchQuery}
                  onChange={handleSearch}
                />
              </InputGroup>
              <Select
                placeholder="All competitions"
                value={selectedCompetition}
                onChange={handleCompetitionChange}
                size="sm"
                width="200px"
              >
                {stats?.available_competitions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </Select>
              <Button
                size="sm"
                colorScheme="brand"
                onClick={() => handleStatCardClick('/predictions/active')}
              >
                View All
              </Button>
            </HStack>
          </HStack>
          
          {stats?.recent_predictions.length > 0 ? (
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Match</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSort('competition')}>
                      <Text>Competition</Text>
                      {sortBy === 'competition' && (
                        <Icon as={sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon} />
                      )}
                    </HStack>
                  </Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSort('date')}>
                      <Text>Time</Text>
                      {sortBy === 'date' && (
                        <Icon as={sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon} />
                      )}
                    </HStack>
                  </Th>
                  <Th>Prediction</Th>
                  <Th>
                    <HStack spacing={1} cursor="pointer" onClick={() => handleSort('confidence')}>
                      <Text>Confidence</Text>
                      {sortBy === 'confidence' && (
                        <Icon as={sortOrder === 'asc' ? ChevronUpIcon : ChevronDownIcon} />
                      )}
                    </HStack>
                  </Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {stats.recent_predictions.map((match) => (
                  <Tr 
                    key={match.id}
                    cursor="pointer"
                    onClick={() => handleStatCardClick(`/matches/${match.id}`)}
                    _hover={{ bg: hoverBgColor }}
                  >
                    <Td>{match.home_team} vs {match.away_team}</Td>
                    <Td>
                      <Badge colorScheme="blue">{match.competition}</Badge>
                    </Td>
                    <Td>{format(new Date(match.match_time), 'MMM d, HH:mm')}</Td>
                    <Td>{match.prediction || 'Not predicted'}</Td>
                    <Td>
                      {match.confidence 
                        ? `${(match.confidence * 100).toFixed(0)}%`
                        : '-'
                      }
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          match.status === 'scheduled'
                            ? 'green'
                            : match.status === 'in_progress'
                            ? 'yellow'
                            : 'gray'
                        }
                      >
                        {match.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <Text color="gray.500" textAlign="center">No recent predictions</Text>
          )}
        </Box>
      </VStack>
    </Container>
  );
};

export default NewDashboard; 