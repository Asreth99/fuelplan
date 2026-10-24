import { useTheme } from "next-themes";
import "./appearanceSetting.css";

const OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * Light or dark colours, or follow the device. The choice is kept on this device by next-themes
 * (Chakra's provider), which puts class="dark" on <html>; theme.css swaps the tokens from there.
 */
export default function AppearanceSetting() {
  const { theme = "system", setTheme } = useTheme();
  return (
    <section className="appearance" aria-labelledby="appearance-title">
      <h2 id="appearance-title" className="appearance__title">
        Appearance
      </h2>
      <div className="seg appearance__seg" role="group" aria-labelledby="appearance-title">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
