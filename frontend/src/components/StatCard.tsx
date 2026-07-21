import React from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  color: "blue" | "green" | "red" | "amber";
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  color,
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    red: "bg-red-50 border-red-200",
    amber: "bg-amber-50 border-amber-200",
  };

  const valueClasses = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-700",
    amber: "text-amber-700",
  };

  return (
    <div className={`border rounded-xl p-5 ${colorClasses[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
        {title}
      </p>
      <p className={`text-3xl font-bold ${valueClasses[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

export default StatCard;
