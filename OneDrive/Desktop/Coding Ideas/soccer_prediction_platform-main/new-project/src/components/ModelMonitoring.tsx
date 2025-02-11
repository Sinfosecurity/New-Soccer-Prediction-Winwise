import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  Line,
  Bar,
  Radar,
  Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonitoringData {
  model_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    feature_importance: Record<string, number>;
    timestamp: string;
  };
  accuracy_report: {
    overall_accuracy: number;
    total_predictions: number;
    league_metrics: Record<string, {
      correct: number;
      total: number;
      accuracy: number;
    }>;
  };
  model_insights: {
    confidence_correlation: number;
    home_bias: number;
    value_betting_accuracy: number;
    high_confidence_threshold: number;
  };
  roi_analysis: {
    overall_roi: number;
    monthly_roi: Record<string, number>;
    by_league_roi: Record<string, number>;
    by_bet_type_roi: Record<string, number>;
  };
  betting_edge: {
    average_edge: number;
    total_value_bets: number;
    successful_value_bets: number;
    edge_distribution: Record<string, number>;
  };
  alerts: Array<{
    type: 'warning' | 'error' | 'info' | 'success';
    message: string;
    timestamp: string;
  }>;
}

const ModelMonitoring: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/v1/predictions/model/monitoring');
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError('Failed to fetch monitoring data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return <Text>Loading monitoring data...</Text>;
  }

  if (error || !data) {
    return <Alert status="error">{error || 'Failed to load data'}</Alert>;
  }

  const roiChartData = {
    labels: Object.keys(data.roi_analysis.monthly_roi),
    datasets: [{
      label: 'Monthly ROI',
      data: Object.values(data.roi_analysis.monthly_roi),
      fill: true,
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
    }],
  };

  const leaguePerformanceData = {
    labels: Object.keys(data.accuracy_report.league_metrics),
    datasets: [{
      label: 'League Accuracy',
      data: Object.values(data.accuracy_report.league_metrics).map(m => m.accuracy),
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    }],
  };

  const edgeDistributionData = {
    labels: Object.keys(data.betting_edge.edge_distribution),
    datasets: [{
      data: Object.values(data.betting_edge.edge_distribution),
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(54, 162, 235, 0.5)',
        'rgba(255, 206, 86, 0.5)',
      ],
    }],
  };

  return (
    <Box p={6} bg={bgColor} borderRadius="lg" shadow="base" borderWidth="1px" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Model Monitoring Dashboard</Heading>

        {/* Alerts Section */}
        {data.alerts.length > 0 && (
          <VStack spacing={3} align="stretch">
            {data.alerts.map((alert, index) => (
              <Alert key={index} status={alert.type}>
                <AlertIcon />
                <Box>
                  <AlertTitle>{alert.type.toUpperCase()}</AlertTitle>
                  <AlertDescription>
                    {alert.message}
                    <Text fontSize="sm" color="gray.500">
                      {format(new Date(alert.timestamp), 'PPp')}
                    </Text>
                  </AlertDescription>
                </Box>
              </Alert>
            ))}
          </VStack>
        )}

        {/* Key Metrics */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          <Stat>
            <StatLabel>Model Accuracy</StatLabel>
            <StatNumber>{(data.model_metrics.accuracy * 100).toFixed(1)}%</StatNumber>
            <StatHelpText>
              <StatArrow type={data.model_metrics.accuracy > 0.6 ? 'increase' : 'decrease'} />
              Overall Performance
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>ROI</StatLabel>
            <StatNumber>{(data.roi_analysis.overall_roi * 100).toFixed(1)}%</StatNumber>
            <StatHelpText>
              <StatArrow type={data.roi_analysis.overall_roi > 0 ? 'increase' : 'decrease'} />
              Return on Investment
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Value Bets Success</StatLabel>
            <StatNumber>
              {((data.betting_edge.successful_value_bets / data.betting_edge.total_value_bets) * 100).toFixed(1)}%
            </StatNumber>
            <StatHelpText>
              {data.betting_edge.successful_value_bets} of {data.betting_edge.total_value_bets} bets
            </StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Average Edge</StatLabel>
            <StatNumber>{(data.betting_edge.average_edge * 100).toFixed(1)}%</StatNumber>
            <StatHelpText>
              Betting Value Edge
            </StatHelpText>
          </Stat>
        </Grid>

        {/* Detailed Analysis Tabs */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>ROI Analysis</Tab>
            <Tab>League Performance</Tab>
            <Tab>Betting Edge</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box h="400px">
                <Line 
                  data={roiChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Monthly ROI Trend'
                      }
                    }
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box h="400px">
                <Bar
                  data={leaguePerformanceData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'League Performance Analysis'
                      }
                    }
                  }}
                />
              </Box>
            </TabPanel>
            <TabPanel>
              <Box h="400px">
                <Doughnut
                  data={edgeDistributionData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: 'Edge Distribution'
                      }
                    }
                  }}
                />
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default ModelMonitoring; 