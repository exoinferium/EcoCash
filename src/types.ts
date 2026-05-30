export type Page = 'home' | 'login' | 'dashboard' | 'profile' | 'map' | 'ai' | 'redeem';

export type LocationPoint = {
  lat: number;
  lng: number;
};

export type AiEstimate = {
  material: 'Plastic' | 'Garbage' | 'Compost';
  weight: number;
  points: number;
};

export type AppState = {
  loggedIn: boolean;
  userName: string;
  email: string;
  role: 'Member';
  points: number;
  pointsHistory: number[];
  location: LocationPoint | null;
  activity: string[];
  aiEstimate: AiEstimate | null;
  generatedCode: string | null;
  redeemedTotal: number;
  acceptedTos: boolean;
  understoodTermination: boolean;
};
