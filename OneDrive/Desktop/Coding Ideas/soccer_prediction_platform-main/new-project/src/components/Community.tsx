import React from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useColorModeValue,
} from '@chakra-ui/react';
import { useSocial } from '../contexts/SocialContext';

const Community: React.FC = () => {
  const { tips } = useSocial();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Box bg={bgColor} borderRadius="lg" p={6} shadow="base" borderWidth="1px" borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Community</Heading>
        <Text>Connect with other bettors, share tips, and discuss strategies.</Text>
        
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Latest Tips</Tab>
            <Tab>Top Contributors</Tab>
            <Tab>Discussions</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel>
              <Text>Latest betting tips from the community will be displayed here.</Text>
            </TabPanel>
            <TabPanel>
              <Text>Top contributors and their success rates will be shown here.</Text>
            </TabPanel>
            <TabPanel>
              <Text>Active discussions and forums will be displayed here.</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Box>
  );
};

export default Community; 