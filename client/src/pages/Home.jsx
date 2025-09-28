import { Link } from "react-router-dom";
import content from "../data/content.json";
import { useProducts } from "../hooks/useProducts";
import styles from "../styles/home.styles.scss";
import cardStyles from "../styles/card.styles.scss";

const Home = () => {
  const { data, isLoading, isError, error } = useProducts();
  const copy = content.home;

  if (isError) {
    return (
      <section className={styles.page}>
        <h1>{copy.headline}</h1>
        <p className={styles.error}>{error.message}</p>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <h1>{copy.headline}</h1>
        <p>{copy.subHeadline}</p>
        <Link to="/" className={styles.cta}>
          {copy.cta}
        </Link>
      </header>
      <ul className={styles.valueProps}>
        {copy.valueProps.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <section className={styles.products}>
        {isLoading && <p>Loading products...</p>}
        {!isLoading && data?.products?.length === 0 && <p>No products yet.</p>}
        <div className={styles.grid}>
          {data?.products?.map((product) => (
            <article key={product.id} className={cardStyles.card}>
              <div className={cardStyles.cardBody}>
                <h2>{product.title}</h2>
                <p>{product.description}</p>
                <span className={cardStyles.price}>${product.price.toFixed(2)}</span>
              </div>
              <Link to={`/p/${product.slug}`} className={cardStyles.link}>
                View details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
};

export default Home;
