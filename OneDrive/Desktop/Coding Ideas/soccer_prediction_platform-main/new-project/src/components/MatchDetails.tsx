import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Text,
  Spinner,
  useColorModeValue,
  Grid,
  GridItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Button,
  VStack,
  HStack,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useParams, useNavigate } from 'react-router-dom';
import { matchService } from '../services/match';
import { predictionService } from '../services/prediction';

interface MatchDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
  stadium: string;
  weather?: {
    temperature: number;
    condition: string;
    precipitation: number;
  };
  headToHead?: {
    totalMatches: number;
    homeWins: number;
    awayWins: number;
    draws: number;
    lastFiveResults: Array<{
      date: string;
      homeScore: number;
      awayScore: number;
    }>;
  };
  prediction?: {
    predictedWinner: string;
    confidence: number;
    factors: Array<{
      name: string;
      impact: number;
    }>;
  };
}

const MatchDetails: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchMatchDetails = async () => {
      if (!matchId) return;
      
      try {
        const data = await matchService.getMatchDetails(matchId);
        setMatch(data);
      } catch (err) {
        setError('Failed to load match details');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchDetails();
  }, [matchId]);

  const handleMakePrediction = async () => {
    if (!match) return;
    
    setPredicting(true);
    try {
      await predictionService.createPrediction(match.id);
      const updatedMatch = await matchService.getMatchDetails(match.id);
      setMatch(updatedMatch);
      toast({
        title: 'Prediction created',
        description: 'Your prediction has been generated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create prediction',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setPredicting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error || !match) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error || 'Match not found'}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Match Details</Heading>
        <Button
          colorScheme="blue"
          variant="outline"
          onClick={() => navigate('/matches/upcoming')}
        >
          Back to Matches
        </Button>
      </HStack>

      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
        {/* Match Info */}
        <GridItem>
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <VStack align="stretch" spacing={4}>
              <Heading size="md">Match Information</Heading>
              
              <HStack justify="space-between">
                <Text fontSize="xl" fontWeight="bold">{match.homeTeam}</Text>
                <Text fontSize="xl">vs</Text>
                <Text fontSize="xl" fontWeight="bold">{match.awayTeam}</Text>
              </HStack>

              <Divider />

              <Stat>
                <StatLabel>Date & Time</StatLabel>
                <StatNumber>{format(new Date(match.date), 'MMM d, yyyy')}</StatNumber>
                <StatHelpText>{format(new Date(match.date), 'HH:mm')}</StatHelpText>
              </Stat>

              <Stat>
                <StatLabel>League</StatLabel>
                <StatNumber>
                  <Badge colorScheme="blue" fontSize="md">{match.league}</Badge>
                </StatNumber>
              </Stat>

              <Stat>
                <StatLabel>Stadium</StatLabel>
                <StatNumber>{match.stadium}</StatNumber>
              </Stat>

              {match.weather && (
                <Stat>
                  <StatLabel>Weather</StatLabel>
                  <StatNumber>{match.weather.temperature}°C</StatNumber>
                  <StatHelpText>
                    {match.weather.condition} ({match.weather.precipitation}% precipitation)
                  </StatHelpText>
                </Stat>
              )}
            </VStack>
          </Box>
        </GridItem>

        {/* Head to Head */}
        {match.headToHead && (
          <GridItem>
            <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Head to Head</Heading>

                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <Stat>
                    <StatLabel>{match.homeTeam} Wins</StatLabel>
                    <StatNumber>{match.headToHead.homeWins}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Draws</StatLabel>
                    <StatNumber>{match.headToHead.draws}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>{match.awayTeam} Wins</StatLabel>
                    <StatNumber>{match.headToHead.awayWins}</StatNumber>
                  </Stat>
                </Grid>

                <Divider />

                <VStack align="stretch" spacing={2}>
                  <Text fontWeight="bold">Last 5 Matches</Text>
                  {match.headToHead.lastFiveResults.map((result, index) => (
                    <HStack key={index} justify="space-between">
                      <Text>{format(new Date(result.date), 'MMM d, yyyy')}</Text>
                      <Text fontWeight="bold">
                        {result.homeScore} - {result.awayScore}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
            </Box>
          </GridItem>
        )}

        {/* Prediction */}
        <GridItem colSpan={{ base: 1, lg: 2 }}>
          <Box bg={bgColor} p={6} borderRadius="lg" boxShadow="sm" borderWidth="1px" borderColor={borderColor}>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between">
                <Heading size="md">Prediction</Heading>
                {!match.prediction && (
                  <Button
                    colorScheme="blue"
                    isLoading={predicting}
                    onClick={handleMakePrediction}
                  >
                    Generate Prediction
                  </Button>
                )}
              </HStack>

              {match.prediction ? (
                <>
                  <HStack spacing={6}>
                    <Stat>
                      <StatLabel>Predicted Winner</StatLabel>
                      <StatNumber>{match.prediction.predictedWinner}</StatNumber>
                    </Stat>
                    <Stat>
                      <StatLabel>Confidence</StatLabel>
                      <StatNumber>
                        {(match.prediction.confidence * 100).toFixed(1)}%
                      </StatNumber>
                    </Stat>
                  </HStack>

                  <Divider />

                  <VStack align="stretch" spacing={2}>
                    <Text fontWeight="bold">Key Factors</Text>
                    {match.prediction.factors.map((factor, index) => (
                      <HStack key={index} justify="space-between">
                        <Text>{factor.name}</Text>
                        <Badge
                          colorScheme={factor.impact > 0 ? 'green' : 'red'}
                        >
                          {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </>
              ) : (
                <Text color="gray.500">No prediction available yet</Text>
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default MatchDetails; 