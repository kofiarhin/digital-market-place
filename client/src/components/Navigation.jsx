import { NavLink } from 'react-router-dom';
import useSiteCopy from '../hooks/useSiteCopy.js';
import styles from './navigation.styles.scss';

const Navigation = () => {
  const navigationCopy = useSiteCopy('navigation');

  return (
    <header className={styles.navigation}>
      <div className={styles.brand}>{navigationCopy.brand}</div>
      <nav className={styles.links}>
        {navigationCopy.links?.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.active}` : styles.link
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
};

export default Navigation;
