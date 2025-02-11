import ReactGA from 'react-ga4';

export const initGA = (): void => {
  const trackingId = process.env.REACT_APP_GA_TRACKING_ID;
  if (trackingId) {
    ReactGA.initialize(trackingId);
  }
};

export const logPageView = (): void => {
  ReactGA.send({ hitType: "pageview", page: window.location.pathname });
};

export const logEvent = (category: string, action: string, label?: string): void => {
  ReactGA.event({
    category,
    action,
    label,
  } as any);
};

export const logException = (description: string, fatal = false): void => {
  ReactGA.exception({
    description,
    fatal,
  } as any);
}; 