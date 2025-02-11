import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Divider,
  useColorModeValue,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { ChatIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import { useSocial } from '../contexts/SocialContext';
import { useAuth } from '../contexts/AuthContext';

const Messages: React.FC = () => {
  const { messages, userProfiles, sendMessage, markMessageAsRead } = useSocial();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Mark messages as read when selecting a user
  useEffect(() => {
    if (selectedUser && user) {
      messages
        .filter(
          (msg) =>
            msg.senderId === selectedUser &&
            msg.receiverId === user.id &&
            !msg.read
        )
        .forEach((msg) => markMessageAsRead(msg.id));
    }
  }, [selectedUser, messages, user, markMessageAsRead]);

  const handleSendMessage = () => {
    if (!user || !selectedUser || !newMessage.trim()) return;

    sendMessage({
      senderId: user.id,
      receiverId: selectedUser,
      content: newMessage,
    });

    setNewMessage('');
  };

  const getConversationUsers = () => {
    if (!user) return [];

    const userIds = new Set<string>();
    messages.forEach((msg) => {
      if (msg.senderId === user.id) userIds.add(msg.receiverId);
      if (msg.receiverId === user.id) userIds.add(msg.senderId);
    });

    return Array.from(userIds)
      .map((id) => userProfiles.find((profile) => profile.userId === id))
      .filter((profile): profile is NonNullable<typeof profile> => !!profile);
  };

  const getUnreadCount = (userId: string) => {
    if (!user) return 0;
    return messages.filter(
      (msg) =>
        msg.senderId === userId && msg.receiverId === user.id && !msg.read
    ).length;
  };

  const conversationUsers = getConversationUsers();
  const selectedUserProfile = selectedUser
    ? userProfiles.find((profile) => profile.userId === selectedUser)
    : null;

  return (
    <HStack align="stretch" spacing={0} h="600px">
      {/* Users List */}
      <Box
        w="300px"
        borderRight="1px"
        borderColor={borderColor}
        overflowY="auto"
      >
        <VStack spacing={0} align="stretch">
          {conversationUsers.map((profile) => (
            <Box
              key={profile.userId}
              p={4}
              cursor="pointer"
              bg={selectedUser === profile.userId ? useColorModeValue('gray.100', 'gray.700') : bgColor}
              _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}
              onClick={() => setSelectedUser(profile.userId)}
            >
              <HStack justify="space-between">
                <HStack>
                  <Avatar size="sm" name={profile.username} />
                  <Text fontWeight="medium">{profile.username}</Text>
                </HStack>
                {getUnreadCount(profile.userId) > 0 && (
                  <Badge colorScheme="red" borderRadius="full">
                    {getUnreadCount(profile.userId)}
                  </Badge>
                )}
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Chat Area */}
      <VStack flex={1} spacing={4} p={4}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <HStack w="full" pb={4} borderBottom="1px" borderColor={borderColor}>
              <Avatar size="sm" name={selectedUserProfile?.username} />
              <Text fontWeight="bold">{selectedUserProfile?.username}</Text>
            </HStack>

            {/* Messages */}
            <VStack flex={1} w="full" overflowY="auto" spacing={4}>
              {messages
                .filter(
                  (msg) =>
                    (msg.senderId === selectedUser &&
                      msg.receiverId === user?.id) ||
                    (msg.senderId === user?.id &&
                      msg.receiverId === selectedUser)
                )
                .map((msg) => (
                  <Box
                    key={msg.id}
                    alignSelf={
                      msg.senderId === user?.id ? 'flex-end' : 'flex-start'
                    }
                    maxW="70%"
                  >
                    <Box
                      bg={
                        msg.senderId === user?.id
                          ? 'blue.500'
                          : useColorModeValue('gray.100', 'gray.700')
                      }
                      color={msg.senderId === user?.id ? 'white' : undefined}
                      p={3}
                      borderRadius="lg"
                    >
                      <Text>{msg.content}</Text>
                    </Box>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </Text>
                  </Box>
                ))}
            </VStack>

            {/* Message Input */}
            <HStack w="full">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
              />
              <IconButton
                aria-label="Send message"
                icon={<ArrowForwardIcon />}
                colorScheme="blue"
                onClick={handleSendMessage}
              />
            </HStack>
          </>
        ) : (
          <VStack flex={1} justify="center" spacing={4} opacity={0.5}>
            <ChatIcon boxSize={10} />
            <Text>Select a user to start messaging</Text>
          </VStack>
        )}
      </VStack>
    </HStack>
  );
};

export default Messages; 