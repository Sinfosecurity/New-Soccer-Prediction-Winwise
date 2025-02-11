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
  HStack,
  Select,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { matchService } from '../services/match';

interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
  stadium: string;
  hasPrediction: boolean;
}

const UpcomingMatches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLeague, setSelectedLeague] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await matchService.getUpcomingMatches();
        setMatches(data);
      } catch (err) {
        setError('Failed to load upcoming matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const leagues = Array.from(new Set(matches.map(match => match.league)));
  
  const filteredMatches = matches.filter(match => {
    const matchLeague = selectedLeague === 'all' || match.league === selectedLeague;
    const matchSearch = searchQuery.trim() === '' || 
      match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.stadium.toLowerCase().includes(searchQuery.toLowerCase());
    return matchLeague && matchSearch;
  });

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
    <Box>
      <Heading size="lg" mb={6}>Upcoming Matches</Heading>
      
      {/* Filters */}
      <HStack spacing={4} mb={6}>
        <FormControl maxW="200px">
          <FormLabel>League</FormLabel>
          <Select
            value={selectedLeague}
            onChange={(e) => setSelectedLeague(e.target.value)}
          >
            <option value="all">All Leagues</option>
            {leagues.map(league => (
              <option key={league} value={league}>{league}</option>
            ))}
          </Select>
        </FormControl>
        
        <FormControl>
          <FormLabel>Search</FormLabel>
          <Input
            placeholder="Search by team or stadium..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </FormControl>
      </HStack>

      <Box bg={bgColor} borderRadius="lg" boxShadow="sm" p={6}>
        {filteredMatches.length === 0 ? (
          <Text textAlign="center" py={10} color="gray.500">
            No matches found
          </Text>
        ) : (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Date</Th>
                <Th>Match</Th>
                <Th>League</Th>
                <Th>Stadium</Th>
                <Th>Status</Th>
                <Th>Action</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredMatches.map((match) => (
                <Tr key={match.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                  <Td>
                    <Text>
                      {format(new Date(match.date), 'MMM d, yyyy')}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      {format(new Date(match.date), 'HH:mm')}
                    </Text>
                  </Td>
                  <Td>
                    {match.homeTeam} vs {match.awayTeam}
                  </Td>
                  <Td>
                    <Badge colorScheme="blue">{match.league}</Badge>
                  </Td>
                  <Td>{match.stadium}</Td>
                  <Td>
                    <Badge
                      colorScheme={match.hasPrediction ? 'green' : 'yellow'}
                    >
                      {match.hasPrediction ? 'Predicted' : 'Not Predicted'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      onClick={() => handleViewMatch(match.id)}
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
    </Box>
  );
};

export default UpcomingMatches; 