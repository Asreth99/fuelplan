import { Alert, Box, Presence } from "@chakra-ui/react";
import { useEffect, useState } from "react";

type AlertComponentProps = {
  show: boolean;
  setShow?: (v: boolean) => void;
  title?: string;
  message?: string;
  
};

export default function AlertComponent({ show, setShow, title, message }: AlertComponentProps) {
  const [isVisible, setIsVisible] = useState(show);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsClosed(false);

      const timer = setTimeout(() => {
        setIsClosed(true);
      }, 3000);

      return () => clearTimeout(timer);
    } else if (isVisible) {
      setIsClosed(true);
    }
  }, [show, isVisible]);

  const handleAnimationEnd = () => {
    if (isClosed) {
      setIsVisible(false);
      setIsClosed(false);
      setShow?.(false);
    }
  };

  return (
    <Presence present={isVisible} unmountOnExit={false}>
      <Box
        position="fixed"
        top="10px"
        left="50%"
        transform="translateX(-50%)"
        width="95%"
        maxW="400px"
        zIndex="banner"
        opacity={0.9}
      >
        <Alert.Root
          status="error"
          zIndex={"banner"}
          data-state={isClosed ? "closed" : "open"}
          _open={{
            animationName: "fade-in",
            animationDuration: "300ms",
            animationTimingFunction: "ease-in",
          }}
          _closed={{
            animationName: "fade-out",
            animationDuration: "300ms",
            animationTimingFunction: "ease-out",
          }}
          onAnimationEnd={handleAnimationEnd}
        >
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{title}</Alert.Title>
            <Alert.Description>
              {message}
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      </Box>
    </Presence>
  );
}
