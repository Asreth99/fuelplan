import Icon from "../icons/icon";
import "./cars.css";

// Any colour can be chosen, so the car icon turns dark green on light colours to stay visible.
export function iconColorOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.7 ? "#0a3d33" : "#ffffff";
}

type Props = {
  // No colour: the "Custom values" badge.
  color: string | null;
};

/** Round badge in the car's colour with a car icon. */
export default function CarAvatar({ color }: Props) {
  return color ? (
    <span className="car-avatar" style={{ background: color, color: iconColorOn(color) }} aria-hidden="true">
      <Icon name="car" />
    </span>
  ) : (
    <span className="car-avatar car-avatar--custom" aria-hidden="true">
      <Icon name="sliders" />
    </span>
  );
}
