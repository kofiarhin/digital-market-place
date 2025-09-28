import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import content from "../data/content.json";
import { apiFetch } from "../api/base";
import { useAuthContext } from "../context/AuthContext";
import styles from "../styles/sellerDashboard.styles.scss";

const SellerDashboard = () => {
  const copy = content.sellerDashboard;
  const queryClient = useQueryClient();
  const { token, user, isAuthenticated } = useAuthContext();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    price: "",
    assetKey: "",
    thumbnailUrl: ""
  });

  const { mutate, isPending, error, isSuccess } = useMutation({
    mutationFn: (payload) =>
      apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setForm({ title: "", slug: "", description: "", price: "", assetKey: "", thumbnailUrl: "" });
    }
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title || !form.slug || !form.description || !form.price || !form.assetKey) {
      return;
    }
    mutate({
      ...form,
      price: Number(form.price)
    });
  };

  return (
    <section className={styles.page}>
      <h1>{copy.headline}</h1>
      {!isAuthenticated && <p className={styles.notice}>Sign in as a seller to publish products.</p>}
      {isAuthenticated && user?.role !== "seller" && (
        <p className={styles.notice}>Your account is not a seller. Contact support to upgrade.</p>
      )}
      <ol className={styles.steps}>
        {copy.steps.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} disabled={isPending} />
        </label>
        <label>
          Slug
          <input name="slug" value={form.slug} onChange={handleChange} disabled={isPending} />
        </label>
        <label>
          Description
          <textarea name="description" value={form.description} onChange={handleChange} disabled={isPending} />
        </label>
        <label>
          Price (USD)
          <input name="price" value={form.price} onChange={handleChange} disabled={isPending} type="number" min="0" step="0.01" />
        </label>
        <label>
          Asset key
          <input name="assetKey" value={form.assetKey} onChange={handleChange} disabled={isPending} />
        </label>
        <label>
          Thumbnail URL
          <input name="thumbnailUrl" value={form.thumbnailUrl} onChange={handleChange} disabled={isPending} />
        </label>
        <button type="submit" disabled={!isAuthenticated || user?.role !== "seller" || isPending}>
          {isPending ? "Publishing..." : copy.cta}
        </button>
      </form>
      {error && <p className={styles.error}>{error.message}</p>}
      {isSuccess && <p className={styles.success}>Product published!</p>}
    </section>
  );
};

export default SellerDashboard;
