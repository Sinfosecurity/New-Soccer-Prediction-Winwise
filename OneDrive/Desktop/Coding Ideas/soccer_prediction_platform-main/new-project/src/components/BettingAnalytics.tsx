import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Select,
  useColorModeValue,
} from '@chakra-ui/react';

interface BetRecord {
  id: string;
  date: string;
  match: string;
  betType: string;
  odds: number;
  stake: number;
  result: 'won' | 'lost' | 'pending';
  profit?: number;
  prediction: {
    confidence: number;
    expectedValue: number;
  };
}

const BettingAnalytics: React.FC = () => {
  const [timeFrame, setTimeFrame] = React.useState('30');
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Mock data
  const bettingHistory: BetRecord[] = [
    {
      id: '1',
      date: '2024-02-08',
      match: 'Liverpool vs Burnley',
      betType: 'Home Win',
      odds: 1.65,
      stake: 100,
      result: 'won',
      profit: 65,
      prediction: {
        confidence: 75,
        expectedValue: 1.8,
      },
    },
    {
      id: '2',
      date: '2024-02-07',
      match: 'Real Madrid vs Atletico Madrid',
      betType: 'Over 2.5',
      odds: 2.10,
      stake: 50,
      result: 'lost',
      profit: -50,
      prediction: {
        confidence: 65,
        expectedValue: 1.5,
      },
    },
    // Add more mock data here
  ];

  // Calculate statistics
  const stats = {
    totalBets: bettingHistory.length,
    winRate: (bettingHistory.filter(bet => bet.result === 'won').length / bettingHistory.length) * 100,
    totalProfit: bettingHistory.reduce((acc, bet) => acc + (bet.profit || 0), 0),
    avgOdds: bettingHistory.reduce((acc, bet) => acc + bet.odds, 0) / bettingHistory.length,
    roi: (bettingHistory.reduce((acc, bet) => acc + (bet.profit || 0), 0) / 
          bettingHistory.reduce((acc, bet) => acc + bet.stake, 0)) * 100,
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Betting Analytics</Heading>
          <Text color="gray.600">
            Track your betting performance and analyze your results
          </Text>
        </Box>

        <HStack justify="flex-end">
          <Select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            width="200px"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </Select>
        </HStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Win Rate</StatLabel>
              <StatNumber>{stats.winRate.toFixed(1)}%</StatNumber>
              <Progress value={stats.winRate} colorScheme="green" size="sm" mt={2} />
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Total Profit</StatLabel>
              <StatNumber color={stats.totalProfit >= 0 ? 'green.500' : 'red.500'}>
                ${stats.totalProfit}
              </StatNumber>
              <StatHelpText>
                <StatArrow type={stats.totalProfit >= 0 ? 'increase' : 'decrease'} />
                ROI: {stats.roi.toFixed(1)}%
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Average Odds</StatLabel>
              <StatNumber>{stats.avgOdds.toFixed(2)}</StatNumber>
              <StatHelpText>
                Based on {stats.totalBets} bets
              </StatHelpText>
            </Stat>
          </Box>

          <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <Stat>
              <StatLabel>Prediction Accuracy</StatLabel>
              <StatNumber>71.5%</StatNumber>
              <StatHelpText>
                vs Market Average: 52.3%
              </StatHelpText>
            </Stat>
          </Box>
        </SimpleGrid>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Match</Th>
                <Th>Bet Type</Th>
                <Th isNumeric>Odds</Th>
                <Th isNumeric>Stake</Th>
                <Th>Result</Th>
                <Th isNumeric>Profit/Loss</Th>
                <Th>Prediction Quality</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bettingHistory.map((bet) => (
                <Tr key={bet.id}>
                  <Td>{bet.date}</Td>
                  <Td>{bet.match}</Td>
                  <Td>{bet.betType}</Td>
                  <Td isNumeric>{bet.odds.toFixed(2)}</Td>
                  <Td isNumeric>${bet.stake}</Td>
                  <Td>
                    <Badge
                      colorScheme={
                        bet.result === 'won' ? 'green' : 
                        bet.result === 'lost' ? 'red' : 
                        'yellow'
                      }
                    >
                      {bet.result.toUpperCase()}
                    </Badge>
                  </Td>
                  <Td isNumeric color={bet.profit && bet.profit >= 0 ? 'green.500' : 'red.500'}>
                    {bet.profit && bet.profit >= 0 ? '+' : ''}{bet.profit}
                  </Td>
                  <Td>
                    <HStack spacing={2}>
                      <Progress
                        value={bet.prediction.confidence}
                        colorScheme={bet.prediction.expectedValue >= 1.5 ? 'green' : 'yellow'}
                        size="sm"
                        width="100px"
                      />
                      <Text fontSize="sm">
                        EV: {bet.prediction.expectedValue.toFixed(1)}
                      </Text>
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </VStack>
    </Container>
  );
};

export default BettingAnalytics; 