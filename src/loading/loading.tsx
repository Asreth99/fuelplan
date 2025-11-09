import { Center, Spinner, VStack, Text } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Center
      position="fixed"
      left={0}
      top={0}
      w="100vw"
      h="100vh"
      backgroundColor="white"
      zIndex={99999}
    >
      <VStack>
        <Spinner
          boxSize={"6vh"}
          animationDuration={"0.8s"}
          borderWidth={"4px"}
          color={"#525f70"}
        />
        <Text color={"#525f70"} fontWeight={'bold'}>Loading...</Text>
      </VStack>
    </Center>
  );
}
