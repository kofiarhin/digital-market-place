import useSiteCopy from '../hooks/useSiteCopy.js';
import styles from './notFoundPage.styles.scss';

const NotFoundPage = () => {
  const notFoundCopy = useSiteCopy('notFound');

  return (
    <div className={styles.notFound}>
      {notFoundCopy.title ? <h1 className={styles.title}>{notFoundCopy.title}</h1> : null}
      {notFoundCopy.subtitle ? (
        <p className={styles.subtitle}>{notFoundCopy.subtitle}</p>
      ) : null}
    </div>
  );
};

export default NotFoundPage;
