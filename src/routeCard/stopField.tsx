import { CSSProperties, KeyboardEvent, PointerEvent, useEffect, useState } from "react";
import { Autocomplete } from "@react-google-maps/api";
import Icon from "../icons/icon";

// A place is typed/picked text, or the user's own position from Find my location.
export type RoutePlace = string | google.maps.LatLngLiteral;

export type RouteStop = {
  id: string;
  place: RoutePlace;
};

const MY_LOCATION_LABEL = "Your location";
const placeLabel = (place: RoutePlace) =>
  typeof place === "string" ? place : MY_LOCATION_LABEL;

type Props = {
  stop: RouteStop;
  label: string;
  placeholder: string;
  mark: "start" | "stop" | "end";
  autoFocus: boolean;
  dragging: boolean;
  dragStyle?: CSSProperties;
  onChoose: (place: RoutePlace, location?: google.maps.LatLngLiteral) => void;
  onRemove?: () => void;
  onHandlePointerDown: (e: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerMove: (e: PointerEvent<HTMLButtonElement>) => void;
  onHandlePointerUp: () => void;
  onHandleKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
};

/** One row of the route card: marker, place field with autocomplete and drag handle, and a remove button. */
export default function StopField({
  stop,
  label,
  placeholder,
  mark,
  autoFocus,
  dragging,
  dragStyle,
  onChoose,
  onRemove,
  onHandlePointerDown,
  onHandlePointerMove,
  onHandlePointerUp,
  onHandleKeyDown,
}: Props) {
  const [text, setText] = useState(placeLabel(stop.place));
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // The place can also change from outside the field (e.g. Find my location fills the start).
  useEffect(() => setText(placeLabel(stop.place)), [stop.place]);

  const isMyLocation = typeof stop.place !== "string" && text === MY_LOCATION_LABEL;

  // Fires for a picked suggestion, and for Enter on typed text (then only `name` is set).
  const onPlaceChanged = () => {
    const place = autocomplete?.getPlace();
    const name = place?.formatted_address || place?.name;
    if (!name) return;
    setText(name);
    const location = place?.geometry?.location;
    onChoose(name, location ? { lat: location.lat(), lng: location.lng() } : undefined);
  };

  return (
    <div className={`route-card__stop${dragging ? " route-card__stop--dragging" : ""}`} style={dragStyle}>
      <span className={`route-card__mark route-card__mark--${mark}`} aria-hidden="true" />
      <div className="route-card__field">
        <Autocomplete onLoad={setAutocomplete} onPlaceChanged={onPlaceChanged}>
          <input
            className={`route-card__input${isMyLocation ? " route-card__input--my-location" : ""}`}
            placeholder={placeholder}
            aria-label={label}
            autoFocus={autoFocus}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Autocomplete>
        <button
          type="button"
          className="route-card__handle"
          aria-label={`Reorder ${label}`}
          title="Drag to reorder (or use the arrow keys)"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerUp}
          onPointerCancel={onHandlePointerUp}
          // The browser can take the pointer away (e.g. a system gesture); then the drag ends too.
          onLostPointerCapture={onHandlePointerUp}
          onKeyDown={onHandleKeyDown}
        >
          <Icon name="drag" />
        </button>
      </div>
      {onRemove && (
        <button type="button" className="icon-btn" aria-label={`Remove ${label}`} onClick={onRemove}>
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
