import siteCopy from '../content/siteCopy.json';

const useSiteCopy = (section) => siteCopy[section] || {};

export default useSiteCopy;
