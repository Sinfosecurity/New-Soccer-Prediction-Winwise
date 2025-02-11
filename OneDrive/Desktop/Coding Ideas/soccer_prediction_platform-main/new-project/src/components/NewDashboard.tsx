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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
  Checkbox,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  BarElement,
  ArcElement,
  Filler,
} from 'chart.js';
import { format as dateFormat } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, type DashboardFilters } from '../services/dashboardService';
import {
  RepeatIcon,
  SearchIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DownloadIcon,
  CheckIcon,
} from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

const POLLING_INTERVAL = 30000; // 30 seconds

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
  roi: number | null;
  prediction_type: string;
}

interface RecentPrediction {
  home_team: string;
  away_team: string;
  prediction: string;
  prediction_type: string;
  match_time: string;
  competition: string;
  confidence: number;
  status: string;
}

export interface DashboardStats {
  total_predictions: number;
  accuracy_rate: number;
  upcoming_matches: number;
  active_bets: number;
  prediction_history: PredictionHistoryItem[];
  stats_summary: {
    total_pending: number;
    total_correct: number;
    current_streak: number;
  };
  recent_predictions: RecentPrediction[];
  available_competitions: string[];
  detailed_stats: DetailedStats;
  league_performance: LeaguePerformance[];
  prediction_distribution: Record<string, number>;
}

interface FilterState {
  search: string;
  competition: string;
  dateRange: [number, number];
  confidenceRange: [number, number];
  status: string[];
  predictionType: string[];
  sortBy: 'date' | 'competition' | 'confidence';
  sortOrder: 'asc' | 'desc';
  minOdds: number;
  maxOdds: number;
  resultType: string[];
}

const NewDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'competition' | 'confidence'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<[number, number]>([0, 30]);
  const [confidenceRange, setConfidenceRange] = useState<[number, number]>([0, 100]);
  const [selectedMetrics, setSelectedMetrics] = useState<Array<string>>(['accuracy', 'roi']);
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    competition: '',
    dateRange: [0, 30],
    confidenceRange: [0, 100],
    status: [],
    predictionType: [],
    sortBy: 'date',
    sortOrder: 'desc',
    minOdds: 1.0,
    maxOdds: 10.0,
    resultType: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPredictionType, setSelectedPredictionType] = useState<string>('all');
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const pollingInterval = useRef<NodeJS.Timeout | undefined>();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBgColor = useColorModeValue('gray.50', 'gray.700');

  const fetchDashboardData = useCallback(async (isRefreshing: boolean = false) => {
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

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!stats) return;

    try {
      const getFormattedData = () => {
        const baseData = stats.recent_predictions.map(pred => ({
          date: dateFormat(new Date(pred.match_time), 'yyyy-MM-dd HH:mm'),
          match: `${pred.home_team} vs ${pred.away_team}`,
          competition: pred.competition,
          prediction: pred.prediction || 'N/A',
          confidence: pred.confidence ? `${(pred.confidence * 100).toFixed(0)}%` : 'N/A',
          status: pred.status,
          result: pred.status === 'won' ? 'Won' : pred.status === 'lost' ? 'Lost' : 'Pending'
        }));

        const summaryData = {
          total_predictions: stats.total_predictions,
          accuracy_rate: `${(stats.accuracy_rate * 100).toFixed(1)}%`,
          roi: `${(stats.detailed_stats.roi * 100).toFixed(1)}%`,
          profit_loss: stats.detailed_stats.profit_loss.toFixed(2),
          win_streak: stats.detailed_stats.win_streak,
          average_odds: stats.detailed_stats.average_odds.toFixed(2)
        };

        return { predictions: baseData, summary: summaryData };
      };

      const data = getFormattedData();
      const currentDate = new Date().toISOString().split('T')[0];

      switch (format) {
        case 'csv': {
          const headers = ['Date', 'Match', 'Competition', 'Prediction', 'Confidence', 'Status', 'Result'];
          const csvData = [
            headers,
            ...data.predictions.map(row => [
              row.date,
              row.match,
              row.competition,
              row.prediction,
              row.confidence,
              row.status,
              row.result
            ])
          ].map(row => row.join(',')).join('\n');

          const blob = new Blob([csvData], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `predictions-${currentDate}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          break;
        }
        case 'json': {
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `predictions-${currentDate}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          break;
        }
        case 'pdf': {
          // TODO: Implement PDF export using a library like jsPDF
          console.log('PDF export not yet implemented');
          break;
        }
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      // TODO: Show error notification to user
    }
  };

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleDateRangeChange = (value: [number, number]) => {
    setDateRange(value);
  };

  const handleConfidenceRangeChange = (value: [number, number]) => {
    setConfidenceRange(value);
  };

  const handleFilterChange = (field: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFilterReset = () => {
    setFilters({
      search: '',
      competition: '',
      dateRange: [0, 30],
      confidenceRange: [0, 100],
      status: [],
      predictionType: [],
      sortBy: 'date',
      sortOrder: 'desc',
      minOdds: 1.0,
      maxOdds: 10.0,
      resultType: []
    });
  };

  const getFilteredPredictions = useCallback(() => {
    if (!stats) return [];
    
    return stats.recent_predictions.filter(pred => {
      if (selectedPredictionType !== 'all' && pred.prediction_type !== selectedPredictionType) {
        return false;
      }
      // Search filter
      if (filters.search && !`${pred.home_team} vs ${pred.away_team}`.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Competition filter
      if (filters.competition && pred.competition !== filters.competition) {
        return false;
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(pred.status)) {
        return false;
      }

      // Date range filter
      const predDate = new Date(pred.match_time);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - predDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < filters.dateRange[0] || daysDiff > filters.dateRange[1]) {
        return false;
      }

      // Confidence range filter
      const confidence = pred.confidence ? pred.confidence * 100 : 0;
      if (confidence < filters.confidenceRange[0] || confidence > filters.confidenceRange[1]) {
        return false;
      }

      return true;
    });
  }, [stats, filters, selectedPredictionType]);

  const applyFilters = useCallback(() => {
    if (!stats) return;

    const filteredPredictions = getFilteredPredictions();

    // Apply sorting
    const sortedPredictions = [...filteredPredictions].sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return filters.sortOrder === 'asc'
            ? new Date(a.match_time).getTime() - new Date(b.match_time).getTime()
            : new Date(b.match_time).getTime() - new Date(a.match_time).getTime();
        case 'competition':
          return filters.sortOrder === 'asc'
            ? a.competition.localeCompare(b.competition)
            : b.competition.localeCompare(a.competition);
        case 'confidence':
          const confA = a.confidence || 0;
          const confB = b.confidence || 0;
          return filters.sortOrder === 'asc'
            ? confA - confB
            : confB - confA;
        default:
          return 0;
      }
    });

    return sortedPredictions;
  }, [stats, filters, getFilteredPredictions]);

  // Add chart interaction handlers
  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0) {
      const { datasetIndex, index } = elements[0];
      // Handle click based on chart type and data
      console.log('Chart clicked:', { datasetIndex, index });
    }
  };

  const handleLegendClick = (event: any, legendItem: any) => {
    console.log('Legend clicked:', legendItem);
    // Toggle visibility of the clicked dataset
    const index = legendItem.datasetIndex;
    setSelectedMetrics(prev => {
      const isCurrentlySelected = prev.includes(legendItem.text);
      return isCurrentlySelected
        ? prev.filter(metric => metric !== legendItem.text)
        : [...prev, legendItem.text];
    });
  };

  // Update chart options
  const getChartOptions = (title: string) => {
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          onClick: handleLegendClick,
        },
        title: {
          display: true,
          text: title,
        },
        tooltip: {
          enabled: true,
          mode: 'index' as const,
          intersect: false,
          callbacks: {
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${typeof value === 'number' ? value.toFixed(1) + '%' : value}`;
            },
          },
        },
      },
      scales: {
        x: {
          type: 'category' as const,
          grid: {
            display: false,
          },
        },
        y: {
          type: 'linear' as const,
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            callback: function(this: any, value: number) {
              return value + '%';
            },
          },
        },
      },
    };
    return options;
  };

  // Update performance chart data
  const getPerformanceChartData = () => {
    if (!stats) return { labels: [], datasets: [] };

    const filteredHistory = stats.prediction_history.filter(pred => 
      selectedPredictionType === 'all' || pred.prediction_type === selectedPredictionType
    );

    const datasets = [];
    
    if (selectedMetrics.includes('accuracy')) {
      datasets.push({
        label: 'Accuracy',
        data: filteredHistory.map(item => item.accuracy ? item.accuracy * 100 : null),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true,
        tension: 0.4,
      });
    }

    if (selectedMetrics.includes('roi')) {
      datasets.push({
        label: 'ROI',
        data: filteredHistory.map(item => item.roi ? item.roi * 100 : null),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true,
        tension: 0.4,
      });
    }

    return {
      labels: filteredHistory.map(item => dateFormat(new Date(item.date), 'MMM d')),
      datasets,
    };
  };

  // Update league performance chart data
  const getLeagueChartData = () => {
    if (!stats) return null;

    return {
      labels: stats.league_performance.map(item => item.league_name),
      datasets: [
        {
          label: 'Accuracy',
          data: stats.league_performance.map(item => item.accuracy * 100),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
        {
          label: 'ROI',
          data: stats.league_performance.map(item => (item.profit_loss / item.total_bets) * 100),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderColor: 'rgb(255, 99, 132)',
          borderWidth: 1,
        },
      ],
    };
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
    labels: validPredictionHistory.map(item => dateFormat(new Date(item.date), 'MMM d')),
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

  // Add new chart options
  const performanceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics Over Time',
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Accuracy & ROI (%)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Profit/Loss',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  // Enhanced chart data with multiple metrics
  const enhancedChartData = {
    labels: validPredictionHistory.map(item => dateFormat(new Date(item.date), 'MMM d')),
    datasets: [
      ...(selectedMetrics.includes('accuracy') ? [{
        label: 'Prediction Accuracy',
        data: validPredictionHistory.map(item => (item.accuracy || 0) * 100),
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1,
        yAxisID: 'y',
      }] : []),
      ...(selectedMetrics.includes('roi') ? [{
        label: 'ROI',
        data: validPredictionHistory.map(item => stats.detailed_stats.roi * 100),
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
        yAxisID: 'y',
      }] : []),
      ...(selectedMetrics.includes('profit') ? [{
        label: 'Profit/Loss',
        data: validPredictionHistory.map(item => stats.detailed_stats.profit_loss),
        fill: true,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        yAxisID: 'y1',
      }] : []),
    ],
  };

  // Enhanced chart options with zoom and pan
  const enhancedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Performance Metrics',
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const index = context.dataIndex;
            const day = validPredictionHistory[index];
            const value = context.parsed.y;
            const metric = context.dataset.label;
            
            if (metric === 'Prediction Accuracy') {
              return [
                `${metric}: ${value.toFixed(1)}%`,
                `Correct: ${day.correct}/${day.total} predictions`,
              ];
            }
            return `${metric}: ${value.toFixed(1)}${metric === 'ROI' ? '%' : ''}`;
          },
        },
      },
      zoom: {
        zoom: {
          wheel: { enabled: true },
          pinch: { enabled: true },
          mode: 'xy' as const,
        },
        pan: {
          enabled: true,
          mode: 'xy' as const,
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Percentage (%)',
        },
        grid: {
          drawOnChartArea: true,
        },
      },
      y1: selectedMetrics.includes('profit') ? {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Profit/Loss',
        },
        grid: {
          drawOnChartArea: false,
        },
      } : undefined,
    },
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack justify="space-between">
          <Heading>Dashboard</Heading>
          <HStack spacing={4}>
            <Menu>
              <MenuButton as={Button} leftIcon={<Icon as={FiFilter} />} size="sm">
                Filters
              </MenuButton>
              <MenuList p={4}>
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text mb={2}>Date Range (days)</Text>
                    <RangeSlider
                      value={dateRange}
                      onChange={handleDateRangeChange}
                      min={0}
                      max={90}
                      step={1}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                      <RangeSliderThumb index={1} />
                    </RangeSlider>
                    <Text fontSize="sm" color="gray.500">
                      {dateRange[0]} - {dateRange[1]} days ago
                    </Text>
                  </Box>
                  <Box>
                    <Text mb={2}>Confidence Range (%)</Text>
                    <RangeSlider
                      value={confidenceRange}
                      onChange={handleConfidenceRangeChange}
                      min={0}
                      max={100}
                      step={5}
                    >
                      <RangeSliderTrack>
                        <RangeSliderFilledTrack />
                      </RangeSliderTrack>
                      <RangeSliderThumb index={0} />
                      <RangeSliderThumb index={1} />
                    </RangeSlider>
                    <Text fontSize="sm" color="gray.500">
                      {confidenceRange[0]}% - {confidenceRange[1]}%
                    </Text>
                  </Box>
                </VStack>
              </MenuList>
            </Menu>
            <Button
              leftIcon={<DownloadIcon />}
              onClick={() => handleExport('csv')}
              size="sm"
            >
              Export as CSV
            </Button>
            <Button
              leftIcon={<DownloadIcon />}
              onClick={() => handleExport('json')}
              size="sm"
            >
              Export as JSON
            </Button>
            <Button
              leftIcon={<DownloadIcon />}
              onClick={() => handleExport('pdf')}
              size="sm"
            >
              Export as PDF
            </Button>
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
                    <Td>{dateFormat(new Date(match.match_time), 'MMM d, HH:mm')}</Td>
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

        {/* Enhanced Performance Metrics */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>ROI</StatLabel>
              <StatNumber>{(stats.detailed_stats.roi * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>
                P/L: ${stats.detailed_stats.profit_loss.toFixed(2)}
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Win/Loss Streaks</StatLabel>
              <StatNumber>{stats.detailed_stats.win_streak}W/{stats.detailed_stats.loss_streak}L</StatNumber>
              <StatHelpText>
                Avg Odds: {stats.detailed_stats.average_odds.toFixed(2)}
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderWidth="1px" borderColor={borderColor} borderRadius="lg" shadow="sm">
            <Stat>
              <StatLabel>Value Bets Success</StatLabel>
              <StatNumber>
                {((stats.detailed_stats.value_bets_won / stats.detailed_stats.value_bets_total) * 100).toFixed(1)}%
              </StatNumber>
              <StatHelpText>
                {stats.detailed_stats.value_bets_won}/{stats.detailed_stats.value_bets_total} successful
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        {/* League Performance Chart */}
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>League Performance</Heading>
          <Box height="400px">
            <Bar
              data={getLeagueChartData() || { labels: [], datasets: [] }}
              options={getChartOptions('League Performance Comparison')}
            />
          </Box>
        </Box>

        {/* Prediction Distribution */}
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Prediction Distribution</Heading>
          <Box height="300px">
            <Doughnut
              data={{
                labels: Object.keys(stats.prediction_distribution),
                datasets: [{
                  data: Object.values(stats.prediction_distribution),
                  backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                  ],
                  borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                  ],
                  borderWidth: 1,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right' as const,
                    onClick: handleLegendClick,
                  },
                  tooltip: {
                    callbacks: {
                      label: (context: any) => {
                        const label = context.label || '';
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                      },
                    },
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Performance Metrics Chart */}
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <HStack justify="space-between" mb={4}>
            <Heading size="md">Performance Metrics</Heading>
            <HStack spacing={2}>
              <FormControl w="200px">
                <Select
                  size="sm"
                  value={selectedPredictionType}
                  onChange={(e) => setSelectedPredictionType(e.target.value)}
                >
                  <option value="all">All Prediction Types</option>
                  <option value="1x2">1X2</option>
                  <option value="over_under">Over/Under</option>
                  <option value="btts">BTTS</option>
                  <option value="correct_score">Correct Score</option>
                </Select>
              </FormControl>
              <Button
                size="sm"
                variant={chartType === 'line' ? 'solid' : 'outline'}
                onClick={() => setChartType('line')}
              >
                Line
              </Button>
              <Button
                size="sm"
                variant={chartType === 'bar' ? 'solid' : 'outline'}
                onClick={() => setChartType('bar')}
              >
                Bar
              </Button>
            </HStack>
          </HStack>
          <Box height="400px">
            {chartType === 'line' ? (
              <Line
                data={getPerformanceChartData()}
                options={getChartOptions('Performance Over Time')}
              />
            ) : (
              <Bar
                data={getPerformanceChartData() || { labels: [], datasets: [] }}
                options={getChartOptions('Performance Over Time')}
              />
            )}
          </Box>
        </Box>
      </VStack>
    </Container>
  );
};

export default NewDashboard; 