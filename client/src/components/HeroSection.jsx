import styles from './heroSection.styles.scss';

const HeroSection = ({ eyebrow, title, subtitle, primaryCta, secondaryCta }) => (
  <section className={styles.hero}>
    {eyebrow ? <p className={styles.eyebrow}>{eyebrow}</p> : null}
    {title ? <h1 className={styles.title}>{title}</h1> : null}
    {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
    <div className={styles.actions}>
      {primaryCta ? (
        <button type="button" className={styles.primaryAction}>{primaryCta}</button>
      ) : null}
      {secondaryCta ? (
        <button type="button" className={styles.secondaryAction}>{secondaryCta}</button>
      ) : null}
    </div>
  </section>
);

export default HeroSection;
