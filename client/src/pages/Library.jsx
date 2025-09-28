import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import content from "../data/content.json";
import { apiFetch } from "../api/base";
import { useAuthContext } from "../context/AuthContext";
import styles from "../styles/library.styles.scss";

const Library = () => {
  const copy = content.library;
  const { token, isAuthenticated } = useAuthContext();
  const [orderId, setOrderId] = useState("");

  const { mutate, data, isPending, error, reset } = useMutation({
    mutationFn: async (id) => {
      const tokenResponse = await apiFetch(`/api/downloads/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const downloadResponse = await apiFetch(`/api/downloads/file/${tokenResponse.token}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return downloadResponse;
    }
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!orderId) {
      return;
    }
    mutate(orderId);
  };

  return (
    <section className={styles.page}>
      <h1>{copy.headline}</h1>
      {!isAuthenticated && <p className={styles.notice}>Sign in to view your library.</p>}
      <ul className={styles.instructions}>
        {copy.instructions.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label htmlFor="orderId">Order ID</label>
        <input
          id="orderId"
          name="orderId"
          value={orderId}
          onChange={(event) => {
            if (error) {
              reset();
            }
            setOrderId(event.target.value);
          }}
          placeholder="Paste your order ID"
          disabled={!isAuthenticated || isPending}
        />
        <button type="submit" disabled={!isAuthenticated || isPending}>
          {isPending ? "Generating link..." : "Get download link"}
        </button>
      </form>
      {error && <p className={styles.error}>{error.message}</p>}
      {data?.url ? (
        <a href={data.url} className={styles.download} target="_blank" rel="noreferrer">
          Open secure download
        </a>
      ) : (
        <p className={styles.empty}>{copy.empty}</p>
      )}
    </section>
  );
};

export default Library;
