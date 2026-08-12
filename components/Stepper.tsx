export const DEFAULT_STEPS = ["Select", "Build", "Review Quote", "Confirm"];
export const FIXED_MENU_STEPS = ["Select", "Choose Pax", "Confirm"];

export function Stepper({ current, steps = DEFAULT_STEPS }: { current: number; steps?: string[] }) {
  return (
    <div className="flex items-start">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const done = stepNum < current;
        const active = stepNum === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                  done
                    ? "bg-gold text-forest-dark"
                    : active
                    ? "bg-forest text-white"
                    : "border-2 border-gold-light/60 bg-white text-gray-400"
                }`}
              >
                {done ? "✓" : stepNum}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  active ? "text-forest" : done ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
            {stepNum !== steps.length && (
              <div
                className={`mx-2 mb-5 h-0.5 flex-1 rounded-full ${
                  done ? "bg-gold" : "bg-gold-light/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
