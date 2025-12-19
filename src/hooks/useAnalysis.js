import { useQuery } from "@tanstack/react-query";

const fetchAnalysis = async () => {
  const res = await fetch("http://127.0.0.1:8787", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch analysis");
  return data;
};

export const useAnalysis = () => {
  return useQuery({ queryKey: ["analysis"], queryFn: fetchAnalysis });
};
