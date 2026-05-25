import { useFarm } from "../context/FarmContext";

export default function Agronomy() {
  const { farm } = useFarm();
  return (
    <div className="p-4 md:p-6" data-ocid="agronomy.page">
      <h1 className="text-2xl font-semibold font-display text-foreground mb-2">
        Agronomy
      </h1>
      <p className="text-muted-foreground text-sm">
        {farm
          ? `${farm.name} — agronomy features coming soon.`
          : "Agronomy features coming soon."}
      </p>
    </div>
  );
}
