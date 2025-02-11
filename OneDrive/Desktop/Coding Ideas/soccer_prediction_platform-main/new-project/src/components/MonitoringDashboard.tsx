import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from '@chakra-ui/react';
import {
  Line,
  Bar,
  Radar,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
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
    total_predictions: int;
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

const MonitoringDashboard: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    fetchMonitoringData();
    // Set up polling every 5 minutes
    const interval = setInterval(fetchMonitoringData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/v1/predictions/model/monitoring');
      const newData = await response.json();
      setData(newData);
      checkForAlerts(newData);
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkForAlerts = (newData: MonitoringData) => {
    // Check for performance degradation
    if (newData.model_metrics.accuracy < 0.6) {
      createAlert('error', 'Model accuracy has dropped below 60%');
    }
    if (newData.roi_analysis.overall_roi < -0.1) {
      createAlert('warning', 'Overall ROI has dropped below -10%');
    }
    // Add more alert conditions as needed
  };

  const createAlert = (type: 'warning' | 'error' | 'info' | 'success', message: string) => {
    // Implementation for creating alerts
  };

  if (loading || !data) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Model Monitoring Dashboard</Heading>
        
        {/* Alerts Section */}
        {data.alerts.map((alert, index) => (
          <Alert key={index} status={alert.type}>
            <AlertIcon />
            {alert.message}
          </Alert>
        ))}

        {/* Performance Metrics */}
        <Grid templateColumns="repeat(4, 1fr)" gap={4}>
          <Stat bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <StatLabel>Accuracy</StatLabel>
            <StatNumber>{(data.model_metrics.accuracy * 100).toFixed(1)}%</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              vs. last week
            </StatHelpText>
          </Stat>
          {/* Add similar Stat components for other metrics */}
        </Grid>

        {/* ROI Analysis Chart */}
        <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>ROI Analysis</Heading>
          <Line
            data={{
              labels: Object.keys(data.roi_analysis.monthly_roi),
              datasets: [{
                label: 'Monthly ROI',
                data: Object.values(data.roi_analysis.monthly_roi),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false }
              }
            }}
          />
        </Box>

        {/* League Performance */}
        <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>League Performance</Heading>
          <Bar
            data={{
              labels: Object.keys(data.accuracy_report.league_metrics),
              datasets: [{
                label: 'Accuracy by League',
                data: Object.values(data.accuracy_report.league_metrics).map(m => m.accuracy * 100),
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
              },
              scales: {
                y: { beginAtZero: true, max: 100 }
              }
            }}
          />
        </Box>

        {/* Betting Edge Analysis */}
        <Box bg={bgColor} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Heading size="md" mb={4}>Betting Edge Analysis</Heading>
          <Radar
            data={{
              labels: Object.keys(data.betting_edge.edge_distribution),
              datasets: [{
                label: 'Edge Distribution',
                data: Object.values(data.betting_edge.edge_distribution),
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                borderColor: 'rgb(255, 99, 132)',
                pointBackgroundColor: 'rgb(255, 99, 132)',
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
              },
            }}
          />
        </Box>
      </VStack>
    </Box>
  );
};

export default MonitoringDashboard; 