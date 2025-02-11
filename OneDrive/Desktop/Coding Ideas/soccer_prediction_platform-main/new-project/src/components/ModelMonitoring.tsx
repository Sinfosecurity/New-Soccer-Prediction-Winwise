import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  useColorModeValue,
  Select,
  HStack,
} from '@chakra-ui/react';
import { Line, Bar } from 'react-chartjs-2';
import { format } from 'date-fns';

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
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('accuracy');
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/model-monitoring?timeframe=${selectedTimeframe}`);
        const data = await response.json();
        setMonitoringData(data);
      } catch (error) {
        console.error('Error fetching monitoring data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [selectedTimeframe]);

  if (!monitoringData) {
    return <Box>Loading...</Box>;
  }

  const modelMetricsData = {
    labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score'],
    datasets: [{
      label: 'Model Metrics',
      data: [
        monitoringData.model_metrics.accuracy * 100,
        monitoringData.model_metrics.precision * 100,
        monitoringData.model_metrics.recall * 100,
        monitoringData.model_metrics.f1_score * 100
      ],
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const roiChartData = {
    labels: Object.keys(monitoringData.roi_analysis.monthly_roi),
    datasets: [{
      label: 'Monthly ROI',
      data: Object.values(monitoringData.roi_analysis.monthly_roi).map(roi => roi * 100),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }]
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <VStack spacing={4} align="stretch">
          <HStack justify="space-between">
            <Heading size="md">Model Performance Monitoring</Heading>
            <Select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              width="200px"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </Select>
          </HStack>

          {/* Alerts Section */}
          {monitoringData.alerts.map((alert, index) => (
            <Alert key={index} status={alert.type} borderRadius="md">
              <AlertIcon />
              <Text>{alert.message}</Text>
            </Alert>
          ))}

          {/* Key Metrics */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Stat>
              <StatLabel>Overall Accuracy</StatLabel>
              <StatNumber>{(monitoringData.accuracy_report.overall_accuracy * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>Based on {monitoringData.accuracy_report.total_predictions} predictions</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Value Betting Accuracy</StatLabel>
              <StatNumber>{(monitoringData.model_insights.value_betting_accuracy * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>For high-value opportunities</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Overall ROI</StatLabel>
              <StatNumber>{(monitoringData.roi_analysis.overall_roi * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>Return on Investment</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Average Edge</StatLabel>
              <StatNumber>{(monitoringData.betting_edge.average_edge * 100).toFixed(1)}%</StatNumber>
              <StatHelpText>{monitoringData.betting_edge.total_value_bets} value bets identified</StatHelpText>
            </Stat>
          </SimpleGrid>

          {/* Model Metrics Chart */}
          <Box height="300px">
            <Bar data={modelMetricsData} options={{ maintainAspectRatio: false }} />
          </Box>

          {/* ROI Trend Chart */}
          <Box height="300px">
            <Line data={roiChartData} options={{ maintainAspectRatio: false }} />
          </Box>

          {/* League Performance Table */}
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>League</Th>
                  <Th isNumeric>Accuracy</Th>
                  <Th isNumeric>ROI</Th>
                  <Th isNumeric>Total Predictions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {Object.entries(monitoringData.accuracy_report.league_metrics).map(([league, metrics]) => (
                  <Tr key={league}>
                    <Td>{league}</Td>
                    <Td isNumeric>{(metrics.accuracy * 100).toFixed(1)}%</Td>
                    <Td isNumeric>{(monitoringData.roi_analysis.by_league_roi[league] * 100).toFixed(1)}%</Td>
                    <Td isNumeric>{metrics.total}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </VStack>
      </Box>
    </VStack>
  );
};

export default ModelMonitoring; 