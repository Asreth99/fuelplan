import { Center, Spinner, VStack, Text } from "@chakra-ui/react";

export default function Loading() {
  return (
    <Center
      position="fixed"
      left={0}
      top={0}
      w="100vw"
      h="100vh"
      backgroundColor="#0a3d33"
      zIndex={99999}
    >
      <VStack>
        <Spinner
          boxSize={"6vh"}
          animationDuration={"0.8s"}
          borderWidth={"4px"}
          color={"#c6f36b"}
        />
        <Text color={"#ffffff"} fontWeight={"bold"} fontFamily={"var(--font)"}>
          Loading...
        </Text>
      </VStack>
    </Center>
  );
}
