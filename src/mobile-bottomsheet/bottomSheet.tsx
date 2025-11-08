import { useEffect, useRef, useState } from "react";
import { BottomSheet, BottomSheetRef } from "react-spring-bottom-sheet";
import AutocompleteForm from "../googleMap/autocompleteForm";
import Calculator from "../calculator/calculator";

import "react-spring-bottom-sheet/dist/style.css";
import { Button, Center } from "@chakra-ui/react";

type bottomSheetProps = {
  origin: string;
  setOrigin: (v: string) => void;
  destination: string;
  setDestination: (v: string) => void;
  directions: google.maps.DirectionsResult | null;
  onSubmit: () => void;
  setFromLocation: (v: { lat?: number; lng?: number }) => void;

  avoidFerries: boolean;
  setAvoidFerries: (v: boolean) => void;
  avoidHighways: boolean;
  setAvoidHighways: (v: boolean) => void;
  avoidTolls: boolean;
  setAvoidTolls: (v: boolean) => void;
};
export default function MobileBottomSheet({
  origin,
  setOrigin,
  destination,
  setDestination,
  directions,
  setFromLocation,
  onSubmit,
  avoidFerries,
  setAvoidFerries,
  avoidHighways,
  setAvoidHighways,
  avoidTolls,
  setAvoidTolls,
}: bottomSheetProps) {
  const [open] = useState(true);
  const [mode, setMode] = useState<"menu" | "search" | "calculate">("menu");
  const sheetRef = useRef<BottomSheetRef>(null);

  const snapPoints = ({ maxHeight }: { maxHeight: number }) => [
    maxHeight * 0.15,
    maxHeight,
  ];

  // Figyeljük, ha a mode változik → automatikusan snapTo a megfelelő értékre
  useEffect(() => {
    if (sheetRef.current) {
      if (mode === "search") {
        sheetRef.current.snapTo(({ maxHeight }) => maxHeight * 1.0);
      } else if (mode === "calculate") {
        sheetRef.current.snapTo(({ maxHeight }) => maxHeight * 1.0);
      } else {
        sheetRef.current.snapTo(({ maxHeight }) => maxHeight * 0.1);
      }
    }
  }, [mode]);

  return (
    <>
      <BottomSheet
        ref={sheetRef}
        open={open}
        snapPoints={snapPoints}
        defaultSnap={({ snapPoints }) => snapPoints[0]}
        maxHeight={600}
        expandOnContentDrag={true}
        blocking={false}
      >
        <Center>
          <Button
            onClick={() => setMode("search")}
            bg={mode === "search" ? "gray.100" : "transparent"}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 30 }}
            >
              search
            </span>
          </Button>

          <Button
            onClick={() => setMode("calculate")}
            bg={mode === "calculate" ? "gray.100" : "transparent"}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 30 }}
            >
              calculate
            </span>
          </Button>
        </Center>
        {mode === "search" && (
          <AutocompleteForm
            origin={origin}
            setOrigin={setOrigin}
            destination={destination}
            setDestination={setDestination}
            setFromLocation={setFromLocation}
            avoidFerries={avoidFerries}
            setAvoidFerries={setAvoidFerries}
            avoidHighways={avoidHighways}
            setAvoidHighways={setAvoidHighways}
            avoidTolls={avoidTolls}
            setAvoidTolls={setAvoidTolls}
            onSubmit={() => {
              onSubmit();
              setMode("menu");
            }}
          />
        )}
        {mode === "calculate" && <Calculator directions={directions} />}
      </BottomSheet>
    </>
  );
}
