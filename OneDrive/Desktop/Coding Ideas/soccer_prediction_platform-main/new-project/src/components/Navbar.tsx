import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Button,
  Stack,
  useColorModeValue,
  useColorMode,
  IconButton,
  Text,
  Badge,
  HStack,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon, WarningIcon, StarIcon, ChatIcon, CalendarIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg={useColorModeValue('white', 'gray.800')}
      px={4}
      borderBottom={1}
      borderStyle="solid"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <Text
          fontSize="xl"
          fontWeight="bold"
          as={RouterLink}
          to="/"
          _hover={{ textDecoration: 'none' }}
        >
          Soccer Predictions
        </Text>

        <Flex alignItems="center">
          <Stack direction="row" spacing={4}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
            />

            {isAuthenticated ? (
              <>
                <Button
                  as={RouterLink}
                  to="/"
                  variant="ghost"
                >
                  Dashboard
                </Button>
                <Button
                  as={RouterLink}
                  to="/matches"
                  variant="ghost"
                  position="relative"
                >
                  <HStack spacing={1}>
                    <Text>Upcoming Matches</Text>
                    <CalendarIcon color="purple.400" />
                  </HStack>
                </Button>
                <Button
                  as={RouterLink}
                  to="/live"
                  variant="ghost"
                  position="relative"
                >
                  Live Scores
                  <Badge
                    ml={2}
                    colorScheme="red"
                    variant="solid"
                    borderRadius="full"
                    animation={`${pulseAnimation} 1.5s infinite`}
                  >
                    Live
                  </Badge>
                </Button>
                <Button
                  as={RouterLink}
                  to="/value-bets"
                  variant="ghost"
                  position="relative"
                >
                  <HStack spacing={1}>
                    <Text>Value Bets</Text>
                    <Badge
                      colorScheme="yellow"
                      variant="solid"
                      borderRadius="full"
                    >
                      <HStack spacing={1} px={1}>
                        <WarningIcon boxSize={3} />
                        <Text>High Risk</Text>
                      </HStack>
                    </Badge>
                  </HStack>
                </Button>
                <Button
                  as={RouterLink}
                  to="/analytics"
                  variant="ghost"
                  position="relative"
                >
                  <HStack spacing={1}>
                    <Text>Analytics</Text>
                    <StarIcon color="blue.400" />
                  </HStack>
                </Button>
                <Button
                  as={RouterLink}
                  to="/community"
                  variant="ghost"
                  position="relative"
                >
                  <HStack spacing={1}>
                    <Text>Community</Text>
                    <ChatIcon color="green.400" />
                  </HStack>
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Button
                as={RouterLink}
                to="/login"
                variant="ghost"
              >
                Login
              </Button>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

// Add keyframes for the pulse animation
const pulseAnimation = `@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.5; }
  100% { transform: scale(1); opacity: 1; }
}`;

export default Navbar; 