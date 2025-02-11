import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Divider,
  useColorModeValue,
  Icon,
  Flex,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { StarIcon, WarningIcon, CloseIcon } from '@chakra-ui/icons';
import { keyframes } from '@emotion/react';

interface MatchEvent {
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  minute: number;
  team: 'home' | 'away';
  player: string;
}

interface LiveMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  competition: string;
  liveScore: {
    homeScore: number;
    awayScore: number;
    minute: number;
    events: MatchEvent[];
  };
  stats: {
    possession: {
      home: number;
      away: number;
    };
    shots: {
      home: number;
      away: number;
    };
    shotsOnTarget: {
      home: number;
      away: number;
    };
    corners: {
      home: number;
      away: number;
    };
  };
}

const LiveScores: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([
    // Mock data for testing
    {
      id: '1',
      homeTeam: 'Manchester United',
      awayTeam: 'Liverpool',
      competition: 'Premier League',
      liveScore: {
        homeScore: 2,
        awayScore: 1,
        minute: 67,
        events: [
          { type: 'GOAL', minute: 23, team: 'home', player: 'Marcus Rashford' },
          { type: 'YELLOW_CARD', minute: 35, team: 'away', player: 'Virgil van Dijk' },
          { type: 'GOAL', minute: 45, team: 'away', player: 'Mohamed Salah' },
          { type: 'GOAL', minute: 58, team: 'home', player: 'Bruno Fernandes' },
        ],
      },
      stats: {
        possession: { home: 55, away: 45 },
        shots: { home: 12, away: 10 },
        shotsOnTarget: { home: 5, away: 3 },
        corners: { home: 6, away: 4 },
      },
    },
    // Add more mock matches as needed
  ]);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('red.500', 'red.300');

  // Pulse animation for live indicator
  const pulseKeyframes = keyframes`
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  `;

  const pulseAnimation = `${pulseKeyframes} 1.5s infinite`;

  const LiveMatchCard: React.FC<{ match: LiveMatch }> = ({ match }) => {
    return (
      <Box
        p={6}
        bg={bgColor}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        shadow="md"
      >
        {/* Header with Live Indicator */}
        <HStack justify="space-between" mb={4}>
          <Badge colorScheme="green">{match.competition}</Badge>
          <HStack>
            <Box
              w={2}
              h={2}
              borderRadius="full"
              bg={accentColor}
              animation={pulseAnimation as any}
            />
            <Text color={accentColor} fontWeight="bold">
              {match.liveScore.minute}'
            </Text>
          </HStack>
        </HStack>

        {/* Score Section */}
        <HStack justify="space-between" mb={6}>
          <VStack flex={1} align="flex-start">
            <Text fontSize="xl" fontWeight="bold">
              {match.homeTeam}
            </Text>
            <Text color="gray.500">Home</Text>
          </VStack>
          <Box px={6} py={3} bg={useColorModeValue('gray.100', 'gray.700')} borderRadius="lg">
            <Text fontSize="2xl" fontWeight="bold">
              {match.liveScore.homeScore} - {match.liveScore.awayScore}
            </Text>
          </Box>
          <VStack flex={1} align="flex-end">
            <Text fontSize="xl" fontWeight="bold">
              {match.awayTeam}
            </Text>
            <Text color="gray.500">Away</Text>
          </VStack>
        </HStack>

        {/* Match Stats */}
        <VStack spacing={4} align="stretch">
          <Stat>
            <StatLabel>Possession</StatLabel>
            <Progress
              value={match.stats.possession.home}
              colorScheme="blue"
              size="sm"
              borderRadius="full"
            />
            <StatHelpText>
              {match.stats.possession.home}% - {match.stats.possession.away}%
            </StatHelpText>
          </Stat>

          <SimpleGrid columns={2} spacing={4}>
            <Stat>
              <StatLabel>Shots</StatLabel>
              <StatNumber>{match.stats.shots.home} - {match.stats.shots.away}</StatNumber>
            </Stat>
            <Stat>
              <StatLabel>Shots on Target</StatLabel>
              <StatNumber>
                {match.stats.shotsOnTarget.home} - {match.stats.shotsOnTarget.away}
              </StatNumber>
            </Stat>
          </SimpleGrid>

          <Divider />

          {/* Match Events */}
          <VStack align="stretch" spacing={2}>
            <Text fontWeight="semibold">Match Events</Text>
            {match.liveScore.events.map((event, index) => (
              <HStack key={index} spacing={3}>
                <Text color="gray.500" w="40px">
                  {event.minute}'
                </Text>
                <Icon
                  as={
                    event.type === 'GOAL'
                      ? StarIcon
                      : event.type === 'YELLOW_CARD'
                      ? WarningIcon
                      : CloseIcon
                  }
                  color={
                    event.type === 'GOAL'
                      ? 'green.500'
                      : event.type === 'YELLOW_CARD'
                      ? 'yellow.500'
                      : 'red.500'
                  }
                />
                <Text>
                  {event.player} ({event.team === 'home' ? match.homeTeam : match.awayTeam})
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Box>
    );
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading size="xl" mb={2}>Live Matches</Heading>
          <Text color="gray.600">
            Real-time scores and statistics from ongoing matches
          </Text>
        </Box>

        {liveMatches.length > 0 ? (
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
            {liveMatches.map((match) => (
              <LiveMatchCard key={match.id} match={match} />
            ))}
          </SimpleGrid>
        ) : (
          <Box textAlign="center" py={10}>
            <Text fontSize="lg" color="gray.500">
              No live matches at the moment
            </Text>
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default LiveScores; 