import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Badge,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  VStack,
  HStack,
  Tooltip,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

interface ValueBet {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    competition: string;
    kickoff: string;
  };
  prediction: {
    type: 'home' | 'away' | 'draw';
    odds: number;
    confidence: number;
    expectedValue: number;
    reasoning: string[];
  };
  stats: {
    homeForm: string[];
    awayForm: string[];
    h2h: string[];
  };
}

const ValueBets: React.FC = () => {
  const [valueBets, setValueBets] = useState<ValueBet[]>([
    {
      id: '1',
      match: {
        homeTeam: 'Crystal Palace',
        awayTeam: 'Brighton',
        competition: 'Premier League',
        kickoff: '2024-02-09T19:45:00Z',
      },
      prediction: {
        type: 'away',
        odds: 4.50,
        confidence: 65,
        expectedValue: 2.93,
        reasoning: [
          'Brighton strong away form (4W 1L last 5)',
          'Palace struggling at home (1W 3L 1D)',
          'H2H favors Brighton (3W in last 4 meetings)',
          'Key Palace players injured',
        ],
      },
      stats: {
        homeForm: ['L', 'D', 'L', 'L', 'W'],
        awayForm: ['W', 'W', 'L', 'W', 'W'],
        h2h: ['A', 'A', 'H', 'A', 'D'],
      },
    },
    // Add more mock value bets here
  ]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const getFormColor = (result: string) => {
    switch (result) {
      case 'W': return 'green.500';
      case 'L': return 'red.500';
      case 'D': return 'gray.500';
      default: return 'gray.500';
    }
  };

  const ValueBetCard: React.FC<{ bet: ValueBet }> = ({ bet }) => {
    return (
      <Box
        p={6}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        shadow="md"
      >
        <VStack align="stretch" spacing={4}>
          {/* Match Header */}
          <HStack justify="space-between">
            <Badge colorScheme="blue">{bet.match.competition}</Badge>
            <Text fontSize="sm" color="gray.500">
              {new Date(bet.match.kickoff).toLocaleString()}
            </Text>
          </HStack>

          {/* Teams */}
          <Box>
            <Text fontSize="lg" fontWeight="bold">
              {bet.match.homeTeam} vs {bet.match.awayTeam}
            </Text>
          </Box>

          {/* Prediction Stats */}
          <SimpleGrid columns={3} spacing={4}>
            <Stat>
              <StatLabel>Odds</StatLabel>
              <StatNumber color="green.500">{bet.prediction.odds.toFixed(2)}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Confidence</StatLabel>
              <StatNumber>{bet.prediction.confidence}%</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>
                <Tooltip label="Expected Value = (Probability × Potential Win) - (1 - Probability) × Stake">
                  <HStack spacing={1}>
                    <Text>EV</Text>
                    <InfoIcon />
                  </HStack>
                </Tooltip>
              </StatLabel>
              <StatNumber color="blue.500">{bet.prediction.expectedValue.toFixed(2)}</StatNumber>
            </Stat>
          </SimpleGrid>

          {/* Form Guide */}
          <Box>
            <Text fontSize="sm" fontWeight="semibold" mb={2}>Recent Form</Text>
            <HStack justify="space-between">
              <HStack>
                {bet.stats.homeForm.map((result, index) => (
                  <Badge key={index} colorScheme={result === 'W' ? 'green' : result === 'L' ? 'red' : 'gray'}>
                    {result}
                  </Badge>
                ))}
              </HStack>
              <Text fontSize="sm">vs</Text>
              <HStack>
                {bet.stats.awayForm.map((result, index) => (
                  <Badge key={index} colorScheme={result === 'W' ? 'green' : result === 'L' ? 'red' : 'gray'}>
                    {result}
                  </Badge>
                ))}
              </HStack>
            </HStack>
          </Box>

          {/* Reasoning */}
          <VStack align="stretch" spacing={2}>
            <Text fontSize="sm" fontWeight="semibold">Key Factors:</Text>
            {bet.prediction.reasoning.map((reason, index) => (
              <Text key={index} fontSize="sm" color="gray.600">
                • {reason}
              </Text>
            ))}
          </VStack>

          {/* Action Button */}
          <Button colorScheme="blue" size="lg" width="full">
            Place Bet ({bet.prediction.type.toUpperCase()} WIN @ {bet.prediction.odds.toFixed(2)})
          </Button>
        </VStack>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Value Bets</Heading>
          <Text color="gray.600">
            High-risk, high-reward betting opportunities based on advanced statistical analysis
          </Text>
        </Box>

        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          These are high-risk predictions. Please bet responsibly and only what you can afford to lose.
        </Alert>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
          {valueBets.map((bet) => (
            <ValueBetCard key={bet.id} bet={bet} />
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
};

export default ValueBets; 