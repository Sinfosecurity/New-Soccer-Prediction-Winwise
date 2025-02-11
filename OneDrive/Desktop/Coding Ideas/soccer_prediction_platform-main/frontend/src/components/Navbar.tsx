import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  Link,
  useColorModeValue,
  useColorMode,
  IconButton,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      bg={bgColor}
      px={4}
      borderBottom={1}
      borderStyle={'solid'}
      borderColor={borderColor}
    >
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <Text
          fontSize={'xl'}
          fontWeight={'bold'}
          as={RouterLink}
          to="/"
          _hover={{ textDecoration: 'none' }}
        >
          Soccer Predictions
        </Text>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
            />

            {isAuthenticated ? (
              <>
                <Link as={RouterLink} to="/dashboard">
                  Dashboard
                </Link>
                <Link as={RouterLink} to="/predictions">
                  Predictions
                </Link>
                <Button onClick={handleLogout} variant="ghost">
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link as={RouterLink} to="/login">
                  Login
                </Link>
                <Link as={RouterLink} to="/register">
                  Register
                </Link>
              </>
            )}
          </Stack>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Navbar; 