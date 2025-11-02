import { Center, Spinner } from "@chakra-ui/react";

export default function Loading() {
  return (
      <Center  mt={'auto'} backgroundColor={'white'} w={'100%'} h={'100%'}>
        <Spinner boxSize={'6vh'} animationDuration={"0.8s"} borderWidth={"4px"} color={'#525f70'}/>
      </Center>
  );
}
