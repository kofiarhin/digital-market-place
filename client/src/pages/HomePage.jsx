import HeroSection from '../components/HeroSection.jsx';
import FeatureList from '../components/FeatureList.jsx';
import useSiteCopy from '../hooks/useSiteCopy.js';
import styles from './homePage.styles.scss';

const HomePage = () => {
  const homeCopy = useSiteCopy('home');

  return (
    <div className={styles.homePage}>
      <HeroSection {...(homeCopy.hero || {})} />
      <FeatureList features={homeCopy.features || []} />
    </div>
  );
};

export default HomePage;
