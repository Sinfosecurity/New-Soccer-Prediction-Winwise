import React from 'react';
import {
  Box,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  SlideFade,
} from '@chakra-ui/react';
import { useNotifications } from '../contexts/NotificationContext';

const Notifications: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <Box
      position="fixed"
      top={4}
      right={4}
      zIndex={9999}
    >
      <VStack spacing={2} align="flex-end">
        {notifications.map((notification) => (
          <SlideFade key={notification.id} in={true} offsetY={20}>
            <Alert
              status={notification.type}
              variant="solid"
              borderRadius="md"
              width="300px"
            >
              <AlertIcon />
              <Box flex="1">
                <AlertTitle>{notification.title}</AlertTitle>
                <AlertDescription fontSize="sm">
                  {notification.message}
                </AlertDescription>
              </Box>
              <CloseButton
                onClick={() => removeNotification(notification.id)}
                position="absolute"
                right={1}
                top={1}
              />
            </Alert>
          </SlideFade>
        ))}
      </VStack>
    </Box>
  );
};

export default Notifications; 