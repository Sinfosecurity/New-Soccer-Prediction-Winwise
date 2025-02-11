import React, { useEffect, useState } from 'react';
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Text,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { predictionService } from '../services/prediction';

interface ActivePrediction {
  id: string;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    league: string;
  };
  predictedWinner: string;
  confidence: number;
  createdAt: string;
}

const ActivePredictions: React.FC = () => {
  const [predictions, setPredictions] = useState<ActivePrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchActivePredictions = async () => {
      try {
        const data = await predictionService.getActivePredictions();
        setPredictions(data);
      } catch (err) {
        setError('Failed to load active predictions');
      } finally {
        setLoading(false);
      }
    };

    fetchActivePredictions();
  }, []);

  const handleViewMatch = (matchId: string) => {
    navigate(`/matches/${matchId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={10}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  return (
    <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={6}>
      <Heading size="lg" mb={6}>Active Predictions</Heading>
      
      {predictions.length === 0 ? (
        <Text textAlign="center" py={10} color="gray.500">
          No active predictions at the moment
        </Text>
      ) : (
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Match</Th>
              <Th>League</Th>
              <Th>Prediction</Th>
              <Th>Confidence</Th>
              <Th>Match Time</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {predictions.map((prediction) => (
              <Tr key={prediction.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                <Td>
                  {prediction.match.homeTeam} vs {prediction.match.awayTeam}
                </Td>
                <Td>
                  <Badge colorScheme="blue">{prediction.match.league}</Badge>
                </Td>
                <Td>{prediction.predictedWinner}</Td>
                <Td>{(prediction.confidence * 100).toFixed(1)}%</Td>
                <Td>
                  <Text>
                    {format(new Date(prediction.match.date), 'MMM d, yyyy')}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {format(new Date(prediction.match.date), 'HH:mm')}
                  </Text>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    onClick={() => handleViewMatch(prediction.match.id)}
                  >
                    View Match
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}
    </Box>
  );
};

export default ActivePredictions; 