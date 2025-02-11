import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  useToast,
  Select,
  FormControl,
  FormLabel,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  competition: string;
}

interface Prediction {
  matchId: string;
  homeWinProbability: number;
  drawProbability: number;
  awayWinProbability: number;
}

const Predictions: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const fetchMatches = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/v1/matches/upcoming`);
      setMatches(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch upcoming matches',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const getPrediction = async (matchId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/v1/predict`, {
        match_id: matchId,
      });
      setPredictions(prev => ({
        ...prev,
        [matchId]: response.data,
      }));
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get prediction',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatProbability = (prob: number): string => {
    return `${(prob * 100).toFixed(1)}%`;
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading>Match Predictions</Heading>

        <Box>
          <FormControl>
            <FormLabel>Select Match</FormLabel>
            <Select
              placeholder="Choose a match"
              value={selectedMatch}
              onChange={(e) => setSelectedMatch(e.target.value)}
            >
              {matches.map((match) => (
                <option key={match.id} value={match.id}>
                  {`${match.homeTeam} vs ${match.awayTeam} - ${match.competition}`}
                </option>
              ))}
            </Select>
          </FormControl>

          <Button
            mt={4}
            colorScheme="blue"
            isLoading={isLoading}
            isDisabled={!selectedMatch}
            onClick={() => selectedMatch && getPrediction(selectedMatch)}
          >
            Get Prediction
          </Button>
        </Box>

        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Match</Th>
                <Th>Date</Th>
                <Th>Competition</Th>
                <Th>Home Win</Th>
                <Th>Draw</Th>
                <Th>Away Win</Th>
              </Tr>
            </Thead>
            <Tbody>
              {matches.map((match) => (
                <Tr key={match.id}>
                  <Td>{`${match.homeTeam} vs ${match.awayTeam}`}</Td>
                  <Td>{new Date(match.date).toLocaleDateString()}</Td>
                  <Td>{match.competition}</Td>
                  <Td>
                    {predictions[match.id]
                      ? formatProbability(predictions[match.id].homeWinProbability)
                      : '-'}
                  </Td>
                  <Td>
                    {predictions[match.id]
                      ? formatProbability(predictions[match.id].drawProbability)
                      : '-'}
                  </Td>
                  <Td>
                    {predictions[match.id]
                      ? formatProbability(predictions[match.id].awayWinProbability)
                      : '-'}
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

export default Predictions; 