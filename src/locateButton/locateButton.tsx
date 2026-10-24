import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Button, Spinner } from "@chakra-ui/react";
import AlertComponent from "../alertComponent/alertComponent";
import useIsMobile from "../isMobile/isMobile";
import { SHEET_MAP_CONTROLS_CLASS } from "../mobile-bottomsheet/bottomSheet";

type Props = {
  map: google.maps.Map | null;
  onLocated: (position: google.maps.LatLngLiteral) => void;
};

const LOCATED_ZOOM = 16;
const DOT_BLUE = "#1E5EFF";
const HALO_BLUE = "#E3EAFD";

export default function LocateButton({ map, onLocated }: Props) {
  const [container] = useState(() => document.createElement("div"));
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const isMobile = useIsMobile();

  // On mobile, float above the bottom sheet (which covers the bottom of the map);
  // on desktop, sit with Google's own controls in the bottom-right corner.
  useEffect(() => {
    if (!map) return;
    const sheetSlot = document.querySelector(`.${SHEET_MAP_CONTROLS_CLASS}`);
    if (isMobile && sheetSlot) {
      sheetSlot.appendChild(container);
      return () => container.remove();
    }

    const controls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM];
    controls.push(container);

    return () => {
      const index = controls.getArray().indexOf(container);
      if (index >= 0) controls.removeAt(index);
    };
  }, [map, isMobile, container]);

  const locate = () => {
    // Browsers block geolocation on plain-http pages (e.g. http://192.168.x.x), regardless of phone settings.
    if (!window.isSecureContext) {
      setError("Location only works on a secure (https://) connection.");
      return;
    }
    if (!navigator.geolocation) {
      setError("Your browser does not support location services.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        map?.panTo(position);
        map?.setZoom(LOCATED_ZOOM);
        onLocated(position);
        setLocating(false);
      },
      (positionError) => {
        setError(
          positionError.code === positionError.PERMISSION_DENIED
            ? "Location access was denied. Allow it in your browser settings."
            : "Could not determine your location. Please try again."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  return (
    <>
      {createPortal(
        <Button
          aria-label="Find my location"
          title="Find my location"
          onClick={locate}
          disabled={locating}
          bg="var(--surface)" // white, or dark in dark mode
          color={DOT_BLUE}
          w={isMobile ? "48px" : "40px"}
          h={isMobile ? "48px" : "40px"}
          minW="0"
          p="0"
          m="10px"
          borderRadius={isMobile ? "14px" : "2px"}
          boxShadow={
            isMobile
              ? "0 2px 8px rgba(0, 0, 0, 0.15)"
              : "rgba(0, 0, 0, 0.3) 0px 1px 4px -1px"
          }
          _hover={{ bg: "var(--row-bg)" }}
        >
          {locating ? (
            <Spinner size="sm" />
          ) : (
            // Google Maps' "you are here" dot: a blue dot with a white ring on a pale blue halo.
            <Box
              w={isMobile ? "32px" : "26px"}
              h={isMobile ? "32px" : "26px"}
              borderRadius="full"
              bg={HALO_BLUE}
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Box
                w={isMobile ? "14px" : "12px"}
                h={isMobile ? "14px" : "12px"}
                borderRadius="full"
                bg={DOT_BLUE}
                border="2px solid white"
              />
            </Box>
          )}
        </Button>,
        container
      )}

      {createPortal(
        <AlertComponent
          show={error !== ""}
          setShow={(show) => !show && setError("")}
          title="Location unavailable"
          message={error}
        />,
        document.body
      )}
    </>
  );
}
