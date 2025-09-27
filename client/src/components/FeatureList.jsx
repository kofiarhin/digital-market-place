import styles from './featureList.styles.scss';

const FeatureList = ({ features }) => (
  <section className={styles.featureGrid}>
    {features?.map((feature) => (
      <article key={feature.title} className={styles.featureCard}>
        <h3 className={styles.featureTitle}>{feature.title}</h3>
        <p className={styles.featureDescription}>{feature.description}</p>
      </article>
    ))}
  </section>
);

export default FeatureList;
