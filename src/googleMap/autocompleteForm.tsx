import {
  Button,
  Field,
  Group,
  Input,
  NumberInput,
  Separator,
  Stack,
} from "@chakra-ui/react";
import { Autocomplete } from "@react-google-maps/api";
import { useState } from "react";

type Props = {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  onSubmit: () => void;
};

export default function AutocompleteForm({
  origin,
  setOrigin,
  destination,
  setDestination,
  onSubmit,
}: Props) {
  const [fromInputValue, setFromInputValue] = useState(origin);
  const [toInputValue, setToInputValue] = useState(destination);
  const [fromLocation, setFromLocation] = useState<{
    lat?: number;
    lng?: number;
  }>({});
  const [toLocation, setToLocation] = useState<{ lat?: number; lng?: number }>(
    {}
  );

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
      <Stack gap="5" align="center" maxW="sm">
        <Autocomplete
          onLoad={setAutocompleteFrom}
          onPlaceChanged={onPlaceChangedFrom}
        >
          <Field.Root>
            <Field.Label>From</Field.Label>
            <Input
              placeholder="Enter origin"
              borderRadius={"10px"}
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
            <Field.Label>To</Field.Label>
            <Input
              placeholder="Enter destination"
              borderRadius={"10px"}
              value={toInputValue}
              onChange={(e) => setToInputValue(e.target.value)}
            />
          </Field.Root>
        </Autocomplete>
        <Separator borderColor="gray.200" width="10vh" size={"md"} />
        <Button type="submit">Search</Button>
      </Stack>
    </form>
    
  );
}
