import useSiteCopy from '../hooks/useSiteCopy.js';
import styles from './footer.styles.scss';

const Footer = () => {
  const footerCopy = useSiteCopy('footer');

  return (
    <footer className={styles.footer}>
      <div className={styles.meta}>{footerCopy.copyright}</div>
      <div className={styles.links}>
        {footerCopy.links?.map((link) => (
          <a key={link.label} href={link.href} className={styles.link}>
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;
