import {
  Button,
  Dialog,
  Portal,
  Separator,
  DataList,
  Text,
  Flex,
} from "@chakra-ui/react";

type DialogProps = {
  passengers: string;
  show: boolean;
  setShow: (v: boolean) => void;
  totalCost: string;

  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  directions: google.maps.DirectionsResult | null;
};

function truncate(str: string, maxLength = 16) {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
}

export default function DialogComponent({
  totalCost,
  show,
  setShow,
  origin,
  setOrigin,
  destination,
  setDestination,
  directions,
  passengers,
}: DialogProps) {
  const distance = directions?.routes[0].legs[0].distance?.text || "";
  const duration = directions?.routes[0].legs[0].duration?.text || "";
  return (
    <>
      <Dialog.Root
        size={{ mdDown: "md", md: "md" }}
        open={show}
        onOpenChange={(details: any) => setShow(details.open)}
        placement={"center"}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg={"white"} borderRadius={"3vh"}>
              <Dialog.Header>
                <Dialog.Title color={"black"}>
                  <Flex gap={8} direction="row" align="center">
                    <Flex direction="row" gap={4}>
                      <Text fontSize="md" fontWeight="bold">
                        From:
                      </Text>
                      <Text
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        maxW="120px"
                      >
                        {truncate(origin, 16)}
                      </Text>
                    </Flex>
                    <Flex direction="row" gap={4}>
                      <Text fontSize="md" fontWeight="bold">
                        To:
                      </Text>
                      <Text> {truncate(destination, 16)}</Text>
                    </Flex>
                  </Flex>
                </Dialog.Title>
              </Dialog.Header>

              <Separator borderColor="gray.200" size={"md"} />

              <Dialog.Body color={"black"}>
                <DataList.Root orientation={"horizontal"}>
                  <DataList.Item>
                    <DataList.ItemLabel fontSize={"xs"} fontWeight={"bold"}>
                      Distance:
                    </DataList.ItemLabel>
                    <DataList.ItemValue>
                      <strong>{distance}</strong>
                    </DataList.ItemValue>
                  </DataList.Item>

                  <DataList.Item>
                    <DataList.ItemLabel fontSize={"xs"} fontWeight={"bold"}>
                      Duration:
                    </DataList.ItemLabel>
                    <DataList.ItemValue>
                      <strong>{duration}</strong>
                    </DataList.ItemValue>
                  </DataList.Item>
                  <Separator borderColor="gray.200" size={"md"} />
                  <DataList.Item>
                    <DataList.ItemLabel fontSize={"xs"} fontWeight={"bold"}>
                      One-Way Cost:
                    </DataList.ItemLabel>
                    <DataList.ItemValue>
                      <strong>
                        {Number(totalCost).toLocaleString("hu-HU")} HUF (
                        {Math.round(
                          Number(totalCost) / Number(passengers)
                        ).toLocaleString("hu-HU")}{" "}
                        HUF / {passengers} passengers)
                      </strong>
                    </DataList.ItemValue>
                  </DataList.Item>

                  <DataList.Item>
                    <DataList.ItemLabel fontSize={"xs"} fontWeight={"bold"}>
                      Return-Trip Cost:
                    </DataList.ItemLabel>
                    <DataList.ItemValue>
                      <strong>
                        {Math.round(Number(totalCost) * 2).toLocaleString(
                          "hu-HU"
                        )}{" "}
                        HUF (
                        {Math.round(
                          (Number(totalCost) * 2) / Number(passengers)
                        ).toLocaleString("hu-HU")}{" "}
                        HUF / {passengers} passengers)
                      </strong>
                    </DataList.ItemValue>
                  </DataList.Item>
                </DataList.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button className="button" variant="outline">
                    Cancel
                  </Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
