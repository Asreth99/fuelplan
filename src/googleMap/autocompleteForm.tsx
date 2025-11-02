import {
  Button,
  Field,
  Input,
  Separator,
  Stack,
  Accordion,
  Text,
  Switch,
  Center,
  Box,
  Card,
  Heading,
} from "@chakra-ui/react";
import { Autocomplete } from "@react-google-maps/api";
import { useState } from "react";

type Props = {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  onSubmit: () => void;
  setFromLocation: (v: { lat?: number; lng?: number }) => void;
  avoidHighways?: boolean;
  setAvoidHighways?: (v: boolean) => void;
  avoidTolls?: boolean;
  setAvoidTolls?: (v: boolean) => void;
  avoidFerries?: boolean;
  setAvoidFerries?: (v: boolean) => void;
};

export default function AutocompleteForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  onSubmit,
  setFromLocation,

  avoidFerries,
  setAvoidFerries,
  avoidHighways,
  setAvoidHighways,
  avoidTolls,
  setAvoidTolls,
}: Props) {
  const [fromInputValue, setFromInputValue] = useState(origin);
  const [toInputValue, setToInputValue] = useState(destination);

  const [autocompleteFrom, setAutocompleteFrom] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteTo, setAutocompleteTo] =
    useState<google.maps.places.Autocomplete | null>(null);

  const onPlaceChangedFrom = () => {
    if (autocompleteFrom) {
      const place = autocompleteFrom.getPlace();
      const formatted = place.formatted_address || "";
      const lat = place.geometry?.location
        ? place.geometry.location.lat()
        : undefined;
      const lng = place.geometry?.location
        ? place.geometry.location.lng()
        : undefined;
      setFromLocation({ lat, lng });
      setOrigin(formatted);
      setFromInputValue(formatted);
    }
  };

  const onPlaceChangedTo = () => {
    if (autocompleteTo) {
      const formatted = autocompleteTo.getPlace().formatted_address || "";
      setDestination(formatted);
      setToInputValue(formatted);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setOrigin(fromInputValue);
        setDestination(toInputValue);
        onSubmit();
      }}
    >
      <Card.Root boxShadow={"sm"} border={"none"}>
        <Card.Body className="card">
          <Stack gap="3" align="center" maxW="sm">
            <Autocomplete
              onLoad={setAutocompleteFrom}
              onPlaceChanged={onPlaceChangedFrom}
            >
              <Field.Root>
                <Input
                  placeholder="Enter origin"
                  borderRadius={"4px"}
                  value={fromInputValue}
                  onChange={(e) => setFromInputValue(e.target.value)}
                />
              </Field.Root>
            </Autocomplete>
            <Autocomplete
              onLoad={setAutocompleteTo}
              onPlaceChanged={onPlaceChangedTo}
            >
              <Field.Root>
                <Input
                  placeholder="Enter destination"
                  borderRadius={"4px"}
                  value={toInputValue}
                  onChange={(e) => setToInputValue(e.target.value)}
                />
              </Field.Root>
            </Autocomplete>
            <Button className="button" type="submit">
              Search
            </Button>
          </Stack>
        </Card.Body>
      </Card.Root>

      <Center>
        <Box w={"30vh"}>
          <Accordion.Root collapsible variant={"plain"}>
            <Accordion.Item value="item-1">
              <Accordion.ItemTrigger>
                <Text ml={'auto'}>Route Options</Text>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody>Avoid</Accordion.ItemBody>

                <Stack direction="column" gap="3" align="left">
                  <Separator borderColor="gray.200" width="30vh" size={"md"} />
                  <Switch.Root
                    checked={avoidHighways}
                    onCheckedChange={(e) => setAvoidHighways?.(e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>Highways</Switch.Label>
                  </Switch.Root>

                  <Switch.Root
                    checked={avoidTolls}
                    onCheckedChange={(e) => setAvoidTolls?.(e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>Tolls</Switch.Label>
                  </Switch.Root>

                  <Switch.Root
                    checked={avoidFerries}
                    onCheckedChange={(e) => setAvoidFerries?.(e.checked)}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                    <Switch.Label>Ferries</Switch.Label>
                  </Switch.Root>
                </Stack>
                <br />
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
        </Box>
      </Center>
    </form>
  );
}
