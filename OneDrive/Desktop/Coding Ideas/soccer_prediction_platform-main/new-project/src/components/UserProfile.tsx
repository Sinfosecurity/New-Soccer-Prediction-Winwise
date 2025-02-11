import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  Badge,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { StarIcon, CheckIcon } from '@chakra-ui/icons';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  userId: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const { getUserProfile, followUser, unfollowUser, tips } = useSocial();
  const { user } = useAuth();
  const profile = getUserProfile(userId);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!profile) return null;

  const isFollowing = user && profile.followers.includes(user.id);
  const userTips = tips.filter((tip) => tip.userId === userId);
  const verifiedTips = userTips.filter((tip) => tip.verified);

  const handleFollowToggle = () => {
    if (!user) return;
    if (isFollowing) {
      unfollowUser(user.id, userId);
    } else {
      followUser(user.id, userId);
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      {/* Profile Header */}
      <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <HStack spacing={6}>
          <Avatar size="xl" name={profile.username} />
          <VStack align="start" flex={1} spacing={2}>
            <HStack justify="space-between" w="full">
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {profile.username}
                </Text>
                <Text color="gray.500">Member since {new Date().toLocaleDateString()}</Text>
              </Box>
              {user && user.id !== userId && (
                <Button
                  colorScheme={isFollowing ? 'gray' : 'blue'}
                  onClick={handleFollowToggle}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </Button>
              )}
            </HStack>
          </VStack>
        </HStack>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>Followers</StatLabel>
            <StatNumber>{profile.followers.length}</StatNumber>
          </Stat>
        </Box>
        <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>Following</StatLabel>
            <StatNumber>{profile.following.length}</StatNumber>
          </Stat>
        </Box>
        <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>Tip Accuracy</StatLabel>
            <StatNumber>{profile.tipAccuracy}%</StatNumber>
            <StatHelpText>{verifiedTips.length} verified tips</StatHelpText>
          </Stat>
        </Box>
        <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
          <Stat>
            <StatLabel>Reputation</StatLabel>
            <StatNumber>{profile.reputation}</StatNumber>
            <StatHelpText>Community standing</StatHelpText>
          </Stat>
        </Box>
      </SimpleGrid>

      {/* Achievements */}
      <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Achievements
        </Text>
        <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
          {profile.achievements.map((achievement) => (
            <Box
              key={achievement.id}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              bg={achievement.unlockedAt ? 'green.50' : 'gray.50'}
              _dark={{
                bg: achievement.unlockedAt ? 'green.900' : 'gray.700',
              }}
            >
              <VStack spacing={2}>
                <Text fontSize="2xl">{achievement.icon}</Text>
                <Text fontWeight="bold">{achievement.name}</Text>
                <Tooltip label={achievement.description}>
                  <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {achievement.description}
                  </Text>
                </Tooltip>
                {achievement.unlockedAt && (
                  <Badge colorScheme="green">
                    <HStack spacing={1}>
                      <CheckIcon boxSize={3} />
                      <Text>Unlocked</Text>
                    </HStack>
                  </Badge>
                )}
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </Box>

      {/* Recent Tips */}
      <Box p={6} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Text fontSize="xl" fontWeight="bold" mb={4}>
          Recent Tips
        </Text>
        <VStack spacing={4} align="stretch">
          {userTips.slice(0, 5).map((tip) => (
            <Box
              key={tip.id}
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">{tip.match}</Text>
                <HStack>
                  {tip.verified && (
                    <Badge colorScheme="green">
                      <HStack spacing={1}>
                        <CheckIcon boxSize={3} />
                        <Text>Verified</Text>
                      </HStack>
                    </Badge>
                  )}
                  <Badge colorScheme="blue">@ {tip.odds}</Badge>
                </HStack>
              </HStack>
              <Text color="gray.500">{tip.prediction}</Text>
            </Box>
          ))}
        </VStack>
      </Box>
    </VStack>
  );
};

export default UserProfile; 