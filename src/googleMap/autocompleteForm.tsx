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
  onSubmit
}: Props) {

  const [fromInputValue, setFromInputValue] = useState(origin);
  const [toInputValue, setToInputValue] = useState(destination);

  const [autocompleteFrom, setAutocompleteFrom] = useState<google.maps.places.Autocomplete | null>(null);
  const [autocompleteTo, setAutocompleteTo] = useState<google.maps.places.Autocomplete | null>(null);

  const onPlaceChangedFrom = () => {
    if (autocompleteFrom) {
      const formatted = autocompleteFrom.getPlace().formatted_address || "";
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
      onSubmit={e => {
        e.preventDefault();
        setOrigin(fromInputValue);
        setDestination(toInputValue);
        onSubmit();
      }}
    >
      <Autocomplete
        onLoad={setAutocompleteFrom}
        onPlaceChanged={onPlaceChangedFrom}
      >
        <input
          value={fromInputValue}
          onChange={e => setFromInputValue(e.target.value)}
          type="text"
          placeholder="From"
          style={{ padding: 6 }}
        />
      </Autocomplete>

      <Autocomplete
        onLoad={setAutocompleteTo}
        onPlaceChanged={onPlaceChangedTo}
      >
        <input
          value={toInputValue}
          onChange={e => setToInputValue(e.target.value)}
          type="text"
          placeholder="To"
          style={{ padding: 6 }}
        />
      </Autocomplete>
      <button style={{ padding: 6, background: "black", color: "white" }} type="submit">Search</button>
    </form>
  );
}