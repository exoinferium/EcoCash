import type { LocationPoint } from './types';

export const STORAGE_KEY = 'trash-for-points-react-state';

export const defaultState = {
  loggedIn: false,
  userName: '',
  email: '',
  role: 'Member',
  points: 0,
  pointsHistory: [0, 4, 9, 7, 12, 18],
  location: null,
  activity: ['No activity yet. Log in to begin tracking points.'],
  aiEstimate: null,
  generatedCode: null,
  redeemedTotal: 0,
  acceptedTos: false,
  understoodTermination: false,
} as const;

export const nearbyPlaces = (location: LocationPoint | null) => {
  const base = [
    { name: 'Green Loop Exchange', type: 'Plastic drop-off', distance: '0.8 mi' },
    { name: 'Neighborhood Surplus Market', type: 'Redeem surplus food', distance: '1.2 mi' },
    { name: 'Community Food Hub', type: 'Pickup and checkout', distance: '1.6 mi' },
  ];

  if (!location) return base;

  return base.map((place, index) => ({
    ...place,
    distance: `${(0.5 + index * 0.4 + Math.abs(location.lat % 1) * 0.2).toFixed(1)} mi`,
  }));
};
