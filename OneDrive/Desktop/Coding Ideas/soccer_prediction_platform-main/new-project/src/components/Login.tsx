import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await login(email, password);
      
      // Show welcome toast with full name
      toast({
        title: `Welcome back, ${user.fullName}! 👋`,
        description: 'Successfully logged in to your account',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });

      // Redirect after the toast appears
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
      
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Please check your credentials and try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6} as="form" onSubmit={handleSubmit}>
          <Heading size="lg">Welcome Back</Heading>
          <Text color="gray.600">Sign in to access your predictions</Text>

          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              size="lg"
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              size="lg"
            />
          </FormControl>

          <Button
            type="submit"
            colorScheme="blue"
            width="full"
            size="lg"
            isLoading={isLoading}
            loadingText="Signing in..."
          >
            Sign In
          </Button>

          <Text>
            Don't have an account?{' '}
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => navigate('/register')}
            >
              Sign up
            </Button>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login; 