import {
  Cloud,
  CloudRain,
  Droplets,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";

const current = {
  location: "Hendricks Farm, IA",
  temp: 58,
  feelsLike: 54,
  condition: "Partly Cloudy",
  wind: "12 mph NW",
  humidity: 62,
  precipChance: 20,
};

// Generate forecast days dynamically from today
function getForecastDays() {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const conditions = ["Partly Cloudy", "Rain", "Cloudy", "Sunny", "Sunny"];
  const highs = [61, 55, 48, 52, 63];
  const lows = [42, 38, 35, 39, 44];
  return conditions.map((condition, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      day: i === 0 ? "Today" : dayNames[d.getDay()],
      high: highs[i],
      low: lows[i],
      condition,
    };
  });
}

const forecast = getForecastDays();

function ConditionIcon({
  condition,
  className,
}: {
  condition: string;
  className?: string;
}) {
  if (condition === "Rain")
    return <CloudRain className={className ?? "w-5 h-5"} />;
  if (condition === "Sunny") return <Sun className={className ?? "w-5 h-5"} />;
  if (condition === "Cloudy")
    return <Cloud className={className ?? "w-5 h-5"} />;
  return <Cloud className={className ?? "w-5 h-5"} />;
}

export function WeatherWidget() {
  return (
    <div data-ocid="dashboard.weather.card" className="space-y-4">
      {/* Current conditions */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">
              {current.temp}°F
            </span>
            <span className="text-sm text-gray-400">
              Feels like {current.feelsLike}°F
            </span>
          </div>
          <div className="text-sm font-medium text-gray-600 mt-0.5">
            {current.condition}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{current.location}</div>
        </div>
        <ConditionIcon
          condition={current.condition}
          className="w-12 h-12 text-blue-400"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xs text-gray-600">{current.wind}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-gray-600">{current.humidity}% RH</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-gray-600">
            {current.precipChance}% precip
          </span>
        </div>
      </div>

      {/* 5-day forecast strip */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-5 gap-1 min-w-0">
          {forecast.map((day, i) => (
            <div
              key={day.day}
              className="flex flex-col items-center gap-1 text-center"
              data-ocid={`dashboard.weather.forecast.item.${i + 1}`}
            >
              <span className="text-xs font-medium text-gray-500">
                {day.day}
              </span>
              <ConditionIcon
                condition={day.condition}
                className={`w-4 h-4 ${
                  day.condition === "Rain"
                    ? "text-blue-400"
                    : day.condition === "Sunny"
                      ? "text-amber-400"
                      : "text-gray-400"
                }`}
              />
              <span className="text-xs font-semibold text-gray-800">
                {day.high}°
              </span>
              <span className="text-xs text-gray-400">{day.low}°</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-300 text-right mt-2">Tomorrow.io</p>
      </div>
    </div>
  );
}
