import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/base";

export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch("/api/products"),
    staleTime: 1000 * 60
  });
