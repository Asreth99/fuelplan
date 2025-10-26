import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import helper from "./helper";
import "./calculator.css";
import {
  Button,
  Field,
  Group,
  NumberInput,
  RadioGroup,
  Spinner,
  Stack,
  HStack,
  Separator,
} from "@chakra-ui/react";
import DialogComponent from "../dialogComponent/dialog";

type CalculatorProps = {
  directions: google.maps.DirectionsResult | null;
};

export default function Calculator({ directions }: CalculatorProps) {
  const [loading, setLoading] = useState(false);
  const [distance, setDistance] = useState("");
  const [consumption, setConsumption] = useState("");
  const [price, setPrice] = useState("");
  const [fuelType, setFuelType] = useState("");
  const [totalCost, setTotalCost] = useState<number | 0>(0);
  const restultDistance = directions?.routes[0].legs[0].distance?.value;

  const [showDialog, setShowDialog] = useState(false);

  const fuelTypes = [
    {
      label: "95-Petrol",
      value: "95-Petrol",
    },
    {
      label: "Diesel",
      value: "Diesel",
    },
  ];

  useEffect(() => {
    if (restultDistance !== undefined) {
      setDistance((restultDistance / 1000).toFixed(0).toString());
    }
  }, [restultDistance]);

  return (
    <div style={{ padding: 20 }}>
      <br />

      <Stack
        gap="5"
        align="center"
        maxW="sm"
        alignItems={"center"}
        colorPalette={"gray"}
      >
        <Field.Root>
          <Field.Label>Select fuel type:</Field.Label>

          <RadioGroup.Root
            colorPalette={"teal"}
            defaultValue={fuelTypes[0].value}
          >
            <HStack gap="6">
              {fuelTypes.map((ft) => (
                <RadioGroup.Item
                  key={ft.value}
                  value={ft.value}
                  colorPalette={"gray.500"}
                  onChange={() => {
                    setFuelType(ft.value);
                  }}
                >
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>{ft.label}</RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </HStack>
          </RadioGroup.Root>
        </Field.Root>

        <Separator borderColor="gray.200" width="10vh" size={"md"} />
        <Field.Root>
          <Field.Label>Full distance (km):</Field.Label>
          <NumberInput.Root defaultValue="10" width="200px">
            <NumberInput.Input
              value={distance}
              onChange={(event) => {
                setDistance(event.target.value);
              }}
            />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Consumption (L/100km):</Field.Label>
          <NumberInput.Root defaultValue="10" width="200px">
            <NumberInput.Input
              value={consumption}
              onChange={(event) => setConsumption(event.target.value)}
            />
          </NumberInput.Root>
        </Field.Root>

        <Field.Root>
          <Field.Label>Fuel price (HUF/L):</Field.Label>
          <Group attached w="full" maxW="sm">
            <NumberInput.Root defaultValue="10" width="200px">
              <NumberInput.Input
                borderLeftRadius={'4px'}
                borderRightRadius={'0px'}
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </NumberInput.Root>

            <Button
              border={'solid'}
              borderWidth={'1px'}
              
              onClick={async () => {
                setLoading(true);
                try {
                  const fetchedPrice = await helper.getFuelPrice();
                  const filteredPrice = fetchedPrice.map((data) => ({
                    fuelType: data.fuelType,
                    average: data.average,
                  }));

                  if (fuelType === "95-Petrol") {
                    console.log("95-Petrol: " + filteredPrice[0].average);
                    setPrice(filteredPrice[0].average);
                  } else {
                    console.log("Diesel: " + filteredPrice[1].average);
                    setPrice(filteredPrice[1].average);
                  }
                } catch (error) {
                  console.error("Error fetching fuel price:", error);
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? (
                <Spinner size="md" />
              ) : (
                <span className="material-symbols-outlined">refresh</span>
              )}
            </Button>
          </Group>
        </Field.Root>

        <Separator borderColor="gray.200" width="10vh" size={"md"} />

        <Button
          onClick={() => {
            setShowDialog(true);
            setTotalCost(
              helper.calculateFuelCost(
                Number(distance),
                Number(consumption),
                Number(price)
              )
            );
          }}
        >
          Calculate
        </Button>
      </Stack>

      {showDialog &&
        createPortal(
          <DialogComponent
            totalCost={totalCost.toFixed(0)}
            show={showDialog}
            setShow={setShowDialog}
          />,
          document.body
        )}
    </div>
  );
}
