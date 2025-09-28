import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../api/base";

export const useProduct = (slug, options = {}) =>
  useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiFetch(`/api/products/${slug}`),
    enabled: Boolean(slug),
    ...options
  });
