import content from "../data/content.json";
import styles from "../styles/cart.styles.scss";

const Cart = () => {
  const copy = content.cart;
  const items = [];

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <section className={styles.page}>
      <h1>{copy.headline}</h1>
      {items.length === 0 && <p className={styles.empty}>{copy.empty}</p>}
      {items.length > 0 && (
        <>
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <footer className={styles.summary}>
            <span>Total</span>
            <strong>${total.toFixed(2)}</strong>
          </footer>
          <button type="button" className={styles.checkout}>
            {copy.cta}
          </button>
        </>
      )}
      <p className={styles.info}>{copy.info}</p>
    </section>
  );
};

export default Cart;
