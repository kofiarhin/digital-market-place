import Navigation from './Navigation.jsx';
import Footer from './Footer.jsx';
import styles from './layout.styles.scss';

const Layout = ({ children }) => (
  <div className={styles.layout}>
    <Navigation />
    <main className={styles.main}>{children}</main>
    <Footer />
  </div>
);

export default Layout;
