import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import content from "../data/content.json";
import { useProduct } from "../hooks/useProduct";
import { apiFetch } from "../api/base";
import { useAuthContext } from "../context/AuthContext";
import styles from "../styles/product.styles.scss";

const Product = () => {
  const { slug } = useParams();
  const { data, isLoading, isError, error } = useProduct(slug);
  const { token, isAuthenticated } = useAuthContext();
  const copy = content.product;

  const { mutate, isPending, data: checkoutData, error: checkoutError } = useMutation({
    mutationFn: ({ productId }) =>
      apiFetch("/api/checkout/session", {
        method: "POST",
        body: JSON.stringify({ productId }),
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }),
    onSuccess: (result) => {
      if (result?.url) {
        window.location.href = result.url;
      }
    }
  });

  if (isLoading) {
    return (
      <section className={styles.page}>
        <p>{copy.fallback}</p>
      </section>
    );
  }

  if (isError || !data?.product) {
    return (
      <section className={styles.page}>
        <p className={styles.error}>{error?.message || "Product unavailable"}</p>
      </section>
    );
  }

  const product = data.product;

  return (
    <section className={styles.page}>
      <article className={styles.details}>
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        <div className={styles.meta}>
          {copy.meta.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <strong className={styles.price}>${product.price.toFixed(2)}</strong>
        {!isAuthenticated && <p className={styles.notice}>Log in to continue to checkout.</p>}
        {checkoutError && <p className={styles.error}>{checkoutError.message}</p>}
        <button
          type="button"
          className={styles.buy}
          onClick={() => mutate({ productId: product.id })}
          disabled={!isAuthenticated || isPending}
        >
          {isPending ? "Preparing checkout..." : copy.purchaseLabel}
        </button>
        {checkoutData?.url && <small>Redirecting you to Stripe...</small>}
      </article>
      <section className={styles.content}>
        <h2>{copy.descriptionTitle}</h2>
        <p>{product.description}</p>
      </section>
    </section>
  );
};

export default Product;
