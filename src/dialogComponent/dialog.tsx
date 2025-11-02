import { Button, Dialog, Portal } from "@chakra-ui/react";

type DialogProps = {
  show: boolean;
  setShow: (v: boolean) => void;
  totalCost: string;
};
export default function DialogComponent({
  totalCost,
  show,
  setShow,
}: DialogProps) {
  return (
    <>
      <Dialog.Root
        open={show}
        onOpenChange={(details: any) => setShow(details.open)}
        placement={"center"}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg={"white"} borderRadius={'3vh'}>
              <Dialog.Header>
                <Dialog.Title color={"black"}>Calculation Result</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body color={"black"}>
                <p>
                  The estimated total fuel cost for your trip is:{" "}
                  <strong>{totalCost} HUF</strong>
                </p>
                <p>
                  For a return trip, the estimated total fuel cost would be:{" "}
                  <strong>{Number(totalCost) * 2} HUF</strong>
                </p>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button className='button' variant="outline">Cancel</Button>
                </Dialog.ActionTrigger>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </>
  );
}
