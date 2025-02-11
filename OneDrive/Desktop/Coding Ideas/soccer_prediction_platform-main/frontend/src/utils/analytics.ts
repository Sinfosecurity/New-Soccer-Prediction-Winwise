import ReactGA from 'react-ga4';

export const initGA = () => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;
  if (trackingId) {
    ReactGA.initialize(trackingId);
  }
};

export const logPageView = () => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category: string, action: string, label?: string) => {
  ReactGA.event({
    category,
    action,
    label,
  });
};

export const logException = (description: string, fatal = false) => {
  ReactGA.exception({
    description,
    fatal,
  });
}; 