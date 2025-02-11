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
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { predictionService } from '../services/prediction';

interface Prediction {
  id: string;
  match: {
    homeTeam: string;
    awayTeam: string;
    date: string;
    score?: {
      home: number;
      away: number;
    };
  };
  predictedWinner: string;
  confidence: number;
  status: 'pending' | 'correct' | 'incorrect';
  createdAt: string;
}

const PredictionHistory: React.FC = () => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const data = await predictionService.getPredictionHistory();
        setPredictions(data);
      } catch (err) {
        setError('Failed to load prediction history');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

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
      <Heading size="lg" mb={6}>Prediction History</Heading>
      
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Match</Th>
            <Th>Prediction</Th>
            <Th>Confidence</Th>
            <Th>Result</Th>
            <Th>Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {predictions.map((prediction) => (
            <Tr key={prediction.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
              <Td>{format(new Date(prediction.createdAt), 'MMM d, yyyy')}</Td>
              <Td>
                {prediction.match.homeTeam} vs {prediction.match.awayTeam}
                <Text fontSize="sm" color="gray.500">
                  {format(new Date(prediction.match.date), 'MMM d, yyyy HH:mm')}
                </Text>
              </Td>
              <Td>{prediction.predictedWinner}</Td>
              <Td>{(prediction.confidence * 100).toFixed(1)}%</Td>
              <Td>
                {prediction.match.score ? (
                  `${prediction.match.score.home} - ${prediction.match.score.away}`
                ) : (
                  'Pending'
                )}
              </Td>
              <Td>
                <Badge
                  colorScheme={
                    prediction.status === 'correct'
                      ? 'green'
                      : prediction.status === 'incorrect'
                      ? 'red'
                      : 'yellow'
                  }
                >
                  {prediction.status.charAt(0).toUpperCase() + prediction.status.slice(1)}
                </Badge>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default PredictionHistory; 