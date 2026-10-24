import { KeyboardEvent, PointerEvent, useRef, useState } from "react";
import Icon, { IconName } from "../icons/icon";
import StopField, { RoutePlace, RouteStop } from "./stopField";
import "./routeCard.css";

export type { RoutePlace, RouteStop };

// Google Directions allows up to 25 waypoints; a handful keeps the card usable on a phone.
export const MAX_STOPS = 10;

export type RouteCardProps = {
  stops: RouteStop[];
  onChoosePlace: (id: string, place: RoutePlace, location?: google.maps.LatLngLiteral) => void;
  onAddStop: () => string;
  onRemoveStop: (id: string) => void;
  onReorderStops: (ids: string[]) => void;
  searching: boolean;
  routeError: string;
  avoidTolls: boolean;
  setAvoidTolls: (v: boolean) => void;
  avoidHighways: boolean;
  setAvoidHighways: (v: boolean) => void;
  avoidFerries: boolean;
  setAvoidFerries: (v: boolean) => void;
};

type Props = RouteCardProps & { className?: string };

type Drag = {
  id: string;
  startY: number;
  rowHeight: number;
  startIndex: number;
  // The order shown while dragging; committed to the parent on drop.
  order: string[];
  offsetY: number;
};

export default function RouteCard({
  stops,
  onChoosePlace,
  onAddStop,
  onRemoveStop,
  onReorderStops,
  searching,
  routeError,
  avoidTolls,
  setAvoidTolls,
  avoidHighways,
  setAvoidHighways,
  avoidFerries,
  setAvoidFerries,
  className = "",
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const stopIds = stops.map((stop) => stop.id);
  // A drag only applies to the list it started on; if the stops changed meanwhile, it is ignored.
  const dragIsCurrent =
    drag !== null &&
    drag.order.length === stopIds.length &&
    drag.order.every((id) => stopIds.includes(id));
  const order = dragIsCurrent ? drag.order : stopIds;
  const shownStops = order.map((id) => stops.find((stop) => stop.id === id)!);

  const startDrag = (e: PointerEvent<HTMLButtonElement>, id: string) => {
    const rows = listRef.current!.children;
    const rowHeight = rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({
      id,
      startY: e.clientY,
      rowHeight,
      startIndex: order.indexOf(id),
      order,
      offsetY: 0,
    });
  };

  // The row follows the pointer; the others make room as soon as it passes half a row.
  const moveDrag = (e: PointerEvent<HTMLButtonElement>) => {
    if (!drag || !dragIsCurrent) return;
    const offsetY = e.clientY - drag.startY;
    const target = Math.min(
      stops.length - 1,
      Math.max(0, drag.startIndex + Math.round(offsetY / drag.rowHeight))
    );
    const nextOrder = drag.order.filter((id) => id !== drag.id);
    nextOrder.splice(target, 0, drag.id);
    setDrag({ ...drag, offsetY, order: nextOrder });
  };

  const endDrag = () => {
    if (!drag) return;
    setDrag(null);
    if (dragIsCurrent && drag.order.join() !== stopIds.join()) onReorderStops(drag.order);
  };

  // Keyboard alternative to dragging: arrow keys move the row up or down.
  const moveWithKeys = (e: KeyboardEvent<HTMLButtonElement>, id: string) => {
    const step = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    const index = order.indexOf(id);
    const target = index + step;
    if (step === 0 || target < 0 || target >= order.length) return;
    e.preventDefault();
    const nextOrder = [...order];
    [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    onReorderStops(nextOrder);
  };

  const describe = (index: number) => {
    const last = shownStops.length - 1;
    if (index === 0) return { label: "Start", placeholder: "Choose starting point", mark: "start" as const };
    if (index === last) return { label: "Destination", placeholder: "Where to?", mark: "end" as const };
    return { label: `Stop ${index}`, placeholder: "Add a stop", mark: "stop" as const };
  };

  const avoidOptions: {
    icon: IconName;
    label: string;
    value: boolean;
    set: (v: boolean) => void;
  }[] = [
    { icon: "toll", label: "Tolls", value: avoidTolls, set: setAvoidTolls },
    { icon: "highway", label: "Highways", value: avoidHighways, set: setAvoidHighways },
    { icon: "ferry", label: "Ferries", value: avoidFerries, set: setAvoidFerries },
  ];

  return (
    <form className={`route-card ${className}`} aria-label="Route" onSubmit={(e) => e.preventDefault()}>
      <div className="route-card__stops" ref={listRef}>
        {shownStops.map((stop, index) => {
          const isDragged = dragIsCurrent && drag.id === stop.id;
          return (
            <StopField
              key={stop.id}
              stop={stop}
              {...describe(index)}
              autoFocus={stop.id === focusId}
              dragging={isDragged}
              dragStyle={
                isDragged
                  ? { transform: `translateY(${drag.offsetY - (index - drag.startIndex) * drag.rowHeight}px)` }
                  : undefined
              }
              onChoose={(place, location) => onChoosePlace(stop.id, place, location)}
              onRemove={stops.length > 2 ? () => onRemoveStop(stop.id) : undefined}
              onHandlePointerDown={(e) => startDrag(e, stop.id)}
              onHandlePointerMove={moveDrag}
              onHandlePointerUp={endDrag}
              onHandleKeyDown={(e) => moveWithKeys(e, stop.id)}
            />
          );
        })}
      </div>

      {stops.length < MAX_STOPS && (
        <button type="button" className="route-card__add" onClick={() => setFocusId(onAddStop())}>
          <Icon name="plus" />
          Add stop
        </button>
      )}

      <div className="route-card__chips" role="group" aria-label="Avoid">
        <span className="route-card__chips-label">Avoid</span>
        {avoidOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            className="chip"
            aria-pressed={option.value}
            onClick={() => option.set(!option.value)}
          >
            <Icon name={option.icon} />
            {option.label}
          </button>
        ))}
      </div>

      {searching && <p className="route-card__status">Finding the best route…</p>}
      {routeError && (
        <p className="route-card__status route-card__status--error" role="alert">
          {routeError}
        </p>
      )}
    </form>
  );
}
