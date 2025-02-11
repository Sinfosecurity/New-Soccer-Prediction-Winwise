import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import axios from 'axios';

interface DashboardStats {
  totalPredictions: number;
  accuracyRate: number;
  upcomingMatches: number;
  recentWins: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPredictions: 0,
    accuracyRate: 0,
    upcomingMatches: 0,
    recentWins: 0,
  });

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/dashboard/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Dashboard</Heading>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          label="Total Predictions"
          value={stats.totalPredictions}
          helpText="All-time predictions made"
          bgColor={bgColor}
          borderColor={borderColor}
        />
        <StatCard
          label="Accuracy Rate"
          value={`${stats.accuracyRate}%`}
          helpText="Correct predictions"
          bgColor={bgColor}
          borderColor={borderColor}
        />
        <StatCard
          label="Upcoming Matches"
          value={stats.upcomingMatches}
          helpText="Matches to predict"
          bgColor={bgColor}
          borderColor={borderColor}
        />
        <StatCard
          label="Recent Wins"
          value={stats.recentWins}
          helpText="Last 30 days"
          bgColor={bgColor}
          borderColor={borderColor}
        />
      </SimpleGrid>

      {/* Add more dashboard components here */}
    </Container>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  helpText: string;
  bgColor: string;
  borderColor: string;
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  helpText,
  bgColor,
  borderColor,
}) => {
  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      <Stat>
        <StatLabel fontSize="sm" fontWeight="medium">
          {label}
        </StatLabel>
        <StatNumber fontSize="3xl" fontWeight="bold">
          {value}
        </StatNumber>
        <StatHelpText>{helpText}</StatHelpText>
      </Stat>
    </Box>
  );
};

export default Dashboard; 