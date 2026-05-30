import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BadgeInfo, LogOut, MapPin, Menu } from 'lucide-react';
import { defaultState, nearbyPlaces, STORAGE_KEY } from './data';
import type { AppState, Page } from './types';

const pages: { id: Page; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'login', label: 'Log in' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profile', label: 'Profile' },
  { id: 'map', label: 'Map' },
  { id: 'ai', label: 'Estimate' },
  { id: 'redeem', label: 'Redeem' },
];

const makeCode = () => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'TRASH-';
  for (let i = 0; i < 6; i += 1) code += alphabet[Math.floor(Math.random() * alphabet.length)];
  return code;
};

const formatPoints = (points: number) => `${Math.round(points)} pts`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);

const formatLocation = (location: AppState['location']) =>
  location ? `${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}` : 'Enable location';

const drawHistory = (values: number[]) => {
  const width = 700;
  const height = 240;
  const padding = 24;
  const safeValues = values.length ? values : [0];
  const max = Math.max(10, ...safeValues);
  const stepX = safeValues.length > 1 ? (width - padding * 2) / (safeValues.length - 1) : 0;
  const points = safeValues.map((value, index) => {
    const x = padding + stepX * index;
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="history-chart" aria-label="Points history chart">
      <polyline className="chart-area" points={`${points.join(' ')} ${width - padding},${height - padding} ${padding},${height - padding}`} />
      <polyline className="chart-line" points={points.join(' ')} />
      {safeValues.map((value, index) => {
        const x = padding + stepX * index;
        const y = height - padding - (value / max) * (height - padding * 2);
        return <circle key={`${value}-${index}`} className="chart-dot" cx={x} cy={y} r="5" />;
      })}
    </svg>
  );
};

const loadState = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState as unknown as AppState;
    return { ...(defaultState as unknown as AppState), ...JSON.parse(raw) };
  } catch {
    return defaultState as unknown as AppState;
  }
};

const saveState = (state: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export function App() {
  const [page, setPage] = useState<Page>('home');
  const [state, setState] = useState<AppState>(loadState);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState('Camera idle');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.title = 'EcoCash';
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page;
    if (pages.some((entry) => entry.id === hash)) setPage(hash);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '') as Page;
      if (pages.some((entry) => entry.id === hash)) setPage(hash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const places = useMemo(() => nearbyPlaces(state.location), [state.location]);

  const navigate = (nextPage: Page) => {
    window.location.hash = nextPage;
    setPage(nextPage);
  };

  const logActivity = (message: string) => {
    setState((current) => ({
      ...current,
      activity: [message, ...current.activity].slice(0, 8),
    }));
  };

  const login = () => {
    setState((current) => ({
      ...current,
      loggedIn: true,
      userName: current.userName || 'Guest',
      email: current.email || 'guest@example.com',
      activity: [`Authenticated with Face ID as ${current.userName || 'Guest'}.`, ...current.activity].slice(0, 8),
    }));
    navigate('dashboard');
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      setScanStatus('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
      setScanStatus('Camera ready. Position your face in frame.');
    } catch {
      setCameraError('Camera access was denied or is unavailable.');
      setScanStatus('Camera unavailable');
      setCameraReady(false);
    }
  };

  const scanFace = () => {
    if (!cameraReady) return;
    setScanStatus('Face matched. Unlocking EcoCash...');
    login();
  };

  const logout = () => {
    setState((current) => ({
      ...current,
      loggedIn: false,
      points: 0,
      pointsHistory: [0],
      generatedCode: null,
      aiEstimate: null,
      redeemedTotal: 0,
      activity: ['Logged out successfully.', ...current.activity].slice(0, 8),
    }));
    navigate('home');
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      const fallback = { lat: 43.6532, lng: -79.3832 };
      setState((current) => ({ ...current, location: fallback }));
      logActivity('Location fallback used: Toronto demo coordinates.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
        setState((current) => ({ ...current, location: nextLocation }));
        logActivity(`Location detected at ${formatLocation(nextLocation)}.`);
      },
      () => {
        const fallback = { lat: 43.6532, lng: -79.3832 };
        setState((current) => ({ ...current, location: fallback }));
        logActivity('Location permission denied. Using demo coordinates.');
      },
    );
  };

  const estimate = (material: 'Plastic' | 'Garbage' | 'Compost', weight: number) => {
    const pricePerPound = material === 'Plastic' ? 10 : material === 'Compost' ? 2.5 : 1;
    const points = Math.max(0, Math.round(weight * pricePerPound));
    setState((current) => ({
      ...current,
      aiEstimate: { material, weight, points },
      points: current.points + points,
      pointsHistory: [...current.pointsHistory.slice(-9), current.points + points],
      activity: [`Estimate calculated ${points} points for ${weight} lb of ${material}.`, ...current.activity].slice(0, 8),
    }));
  };

  const generateRedemptionCode = () => {
    const code = makeCode();
    const redeemedValue = state.points / 100;
    setState((current) => ({
      ...current,
      generatedCode: code,
      redeemedTotal: current.redeemedTotal + redeemedValue,
      points: 0,
      pointsHistory: [...current.pointsHistory.slice(-9), 0],
      activity: [
        `Generated redemption code ${code}. Redeemed ${formatCurrency(redeemedValue)} worth of points.`,
        ...current.activity,
      ].slice(0, 8),
    }));
  };

  const pageShell = (title: string, description: string, body: ReactNode) => (
    <main className="page">
      <section className="hero card">
        <div>
          <p className="eyebrow">EcoCash</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
        </div>
        <aside className="hero-stack">
          <article className="mini-card">
            <span>Status</span>
            <strong>{state.loggedIn ? `Logged in as ${state.userName}` : 'Logged out'}</strong>
          </article>
          <article className="mini-card">
            <span>Balance</span>
            <strong>{formatPoints(state.points)}</strong>
          </article>
          <article className="mini-card">
            <span>Location</span>
            <strong>{formatLocation(state.location)}</strong>
          </article>
        </aside>
      </section>
      {body}
    </main>
  );

  const nav = (
    <header className="site-header">
      <button className="brand-button" onClick={() => navigate('home')}>
        EcoCash
      </button>
      <button className="mobile-menu">
        <Menu size={18} />
      </button>
      <nav className="site-nav">
        {pages.map((entry) => (
          <button
            key={entry.id}
            className={entry.id === page ? 'active' : ''}
            onClick={() => navigate(entry.id)}
          >
            {entry.label}
          </button>
        ))}
        {state.loggedIn ? (
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} /> Logout
          </button>
        ) : null}
      </nav>
    </header>
  );

  return (
    <>
      {nav}
      {page === 'home' &&
        pageShell(
          'Turn litter into livelihood and waste into opportunity',
          'Log in, find nearby locations, and redeem points.',
          <section className="info-grid">
            <article className="card feature-card">
              <h2>Steps</h2>
              <ol className="steps">
                <li>Log in</li>
                <li>Estimate points</li>
                <li>View nearby locations</li>
                <li>Redeem points</li>
              </ol>
            </article>
            <article className="card feature-card">
              <h2>Information</h2>
              <p>Points never expire. Plastic is worth 10 points per pound.</p>
              <button className="btn btn-primary" onClick={state.loggedIn ? logout : login}>
                {state.loggedIn ? 'Logout' : 'Log in'}
              </button>
            </article>
          </section>,
        )}

      {page === 'login' &&
        pageShell(
          'Use Face ID to log into your profile.',
          'Face ID uses the webcam preview.',
          <section className="card form-card">
            <div className="face-id-shell">
              <label className="name-field">
                Name
                <input
                  value={state.userName}
                  onChange={(event) => setState((current) => ({ ...current, userName: event.target.value }))}
                  placeholder="Enter your name"
                />
              </label>
              <section className="tos-panel">
                <h2>Agreement</h2>
                <div className="tos-copy">
                  <p><strong>Privacy Policy</strong></p>
                  <p>EcoCash Incorporated provides waste collection, processing, valuation, and compensation services through infrastructure and digital systems. Users may deposit eligible waste materials and receive compensation based on verified weight and material classification. Users are required to register using a valid legal name and partake in biometric verification. All additional personal information including age, contact information and demographic details are strictly optional. Users are responsible for maintaining the confidentiality of their account credentials and all activities under their account. Compensation is calculated based on verified material weight and category and may be adjusted according to operational conditions and market value fluctuations.</p>
                  <p>Payments may be stored within a user account or withdrawn at the user’s discretion but money may never be deposited. EcoCash Incorporated does not charge mandatory fees for account creation or withdrawals unless explicitly stated. Users agree not to manipulate, falsify, or interfere with waste processing systems or engage in fraudulent or unlawful activity under their respective country’s legislation. EcoCash Incorporated reserves the right to suspend or terminate access to services in cases of suspected misuse or violation of these Terms. EcoCash Incorporated shall not be liable for indirect damages, system interruptions, or losses arising from third-party financial systems or user misuse.</p>
                  <p><strong>Privacy Policy</strong></p>
                  <p>EcoCash Incorporated is committed to protecting user privacy through responsible handling of information. The only required personal information for account creation is a valid legal name and a face recognition. All other information is optional and may include age, demographic details, contact information, language preferences, and transaction history. EcoCash Incorporated does not sell, license, or commercially distribute facial recognition data to any third party. EcoCash Incorporated does not voluntarily share biometric data with any government entity and will only disclose such data when required by valid and legally binding judicial process, and only to the minimum extent required by law. Users may request deletion of optional personal data at any time.</p>
                  <p><strong>Code of Conduct</strong></p>
                  <p>Users of EcoCash Incorporated services are required to behave respectfully toward staff, volunteers, and other users at all times. Users must comply with all operational instructions and safety procedures within EcoCash facilities. Users are prohibited from engaging in fraudulent behavior, damaging infrastructure, interfering with systems, or using services for unlawful purposes. EcoCash Incorporated reserves the right to deny service, suspend accounts, or restrict access to facilities where necessary for safety, compliance, or operational integrity. Serious violations including fraud, theft, vandalism, threats, or violence may result in permanent termination of access and may be referred to appropriate legal authorities. These Terms may be updated from time to time. Continued use of EcoCash services after updates constitutes acceptance of the revised Terms. For inquiries, users may contact EcoCash Incorporated through official communication channels provided at service locations or digital platforms.</p>
                </div>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={state.acceptedTos}
                    onChange={(event) => setState((current) => ({ ...current, acceptedTos: event.target.checked }))}
                  />
                  <span>I have read and understand the terms stated above.</span>
                </label>
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={state.understoodTermination}
                    onChange={(event) => setState((current) => ({ ...current, understoodTermination: event.target.checked }))}
                  />
                  <span>I understand the violation of such terms may result in immediate termination of my EcoCash account.</span>
                </label>
              </section>
              <div className="face-ring">
                <video ref={videoRef} className="face-video" autoPlay playsInline muted />
                {!cameraReady ? <div className="face-placeholder">Camera preview</div> : null}
              </div>
              <p className="status-line">{scanStatus}</p>
              {cameraError ? <p className="error-line">{cameraError}</p> : null}
              <div className="actions-row">
                <button className="btn btn-secondary" onClick={startCamera} type="button">
                  Start camera
                </button>
                <button
                  className="btn btn-primary"
                  onClick={scanFace}
                  type="button"
                  disabled={!cameraReady || !state.acceptedTos || !state.understoodTermination}
                >
                  Scan face
                </button>
              </div>
            </div>
          </section>,
        )}

      {page === 'dashboard' &&
        pageShell(
          'Dashboard of your points over time',
          'The dashboard displays a live graph of your points over time.',
          <section className="dashboard-grid">
            <article className="card stats-card">
              <p className="eyebrow">Wallet</p>
              <h2>{state.loggedIn ? `Welcome back, ${state.userName}` : 'Welcome back'}</h2>
              <div className="wallet">
                <div>
                  <span>Available points</span>
                  <strong>{formatPoints(state.points)}</strong>
                </div>
                <div>
                  <span>Points never expire</span>
                  <strong>Always available</strong>
                </div>
              </div>
            </article>
            <article className="card activity-card">
              <h2>Recent activity</h2>
              <ul className="activity-list">
                {state.activity.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="card chart-card">
              <h2>Points history</h2>
              <p className="status-line">Line graph of points over time.</p>
              <div className="history-chart-wrap">{drawHistory(state.pointsHistory)}</div>
            </article>
          </section>,
        )}

      {page === 'profile' &&
        pageShell(
          'Manage your profile.',
          'The profile page allows the user to update their account details.',
          <section className="card profile-card">
            <div className="profile-grid">
              <article className="mini-card">
                <span>Name</span>
                <strong>{state.userName || 'Guest profile'}</strong>
              </article>
              <article className="mini-card">
                <span>Role</span>
                <strong>{state.role}</strong>
              </article>
              <article className="mini-card">
                <span>Session</span>
                <strong>{state.loggedIn ? 'Active' : 'Signed out'}</strong>
              </article>
            </div>
            <div className="actions-row">
              <button className="btn btn-primary" onClick={state.loggedIn ? logout : login}>
                {state.loggedIn ? 'Logout' : 'Log in'}
              </button>
            </div>
          </section>,
        )}

      {page === 'map' &&
        pageShell(
          'Find locations near you.',
          'Use your location to find nearby exchange buildings.',
          <section className="map-layout">
            <article className="card map-card">
              <div className="map-toolbar">
                <button className="btn btn-primary" onClick={useLocation}>
                  <MapPin size={16} /> Use my location
                </button>
                <span className="status-line">Location: {formatLocation(state.location)}</span>
              </div>
              <div className="map-canvas">
                <div className="map-grid" />
                <div
                  className="map-pin"
                  style={{
                    left: state.location ? `${Math.min(82, Math.max(18, 40 + ((state.location.lng + 180) / 360) * 40))}%` : '50%',
                    top: state.location ? `${Math.min(72, Math.max(20, 25 + ((90 - (state.location.lat + 90) / 2) / 180) * 40))}%` : '50%',
                  }}
                />
                <div className="map-label">{state.location ? `You are here: ${formatLocation(state.location)}` : 'No location selected'}</div>
              </div>
            </article>
            <article className="card nearby-card">
              <h2>Nearby options</h2>
              <ul className="places-list">
                {places.map((place) => (
                  <li key={place.name}>
                    <strong>{place.name}</strong>
                    <span>
                      {place.type} - {place.distance}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          </section>,
        )}

      {page === 'ai' &&
        pageShell(
          'Estimate how much trash should be exchanged for points.',
          'This estimate gives a rough value before the user exchanges it.',
          <section className="card form-card">
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const material = form.get('material') as 'Plastic' | 'Garbage' | 'Compost';
                const weight = Number(form.get('weight'));
                estimate(material, weight);
              }}
            >
              <label>
                Material type
                <select name="material" defaultValue="Plastic">
                  <option>Plastic</option>
                  <option>Garbage</option>
                  <option>Compost</option>
                </select>
              </label>
              <label>
                Weight in pounds
                <input name="weight" type="number" step="0.1" min="0" placeholder="Example: 4.5" />
              </label>
              <button className="btn btn-primary" type="submit">
                Run estimate
              </button>
            </form>
            <div className="estimate-card">
              <p className="status-line">Estimated points</p>
              <strong>{state.aiEstimate ? formatPoints(state.aiEstimate.points) : 'Waiting for estimate'}</strong>
              <p className="status-line">
                {state.aiEstimate
                  ? `${state.aiEstimate.material} at ${state.aiEstimate.weight} lb is worth about ${formatPoints(state.aiEstimate.points)}.`
                  : 'Choose a material and enter weight to estimate the exchange value.'}
              </p>
            </div>
          </section>,
        )}

      {page === 'redeem' &&
        pageShell(
          'Exchange points for credits.',
          'Whenever the user wants to redeem their points, they can generate a code and present it at a partner location.',
          <section className="card redeem-card">
            <div className="redeem-summary">
              <div>
                <span>Current balance</span>
                <strong>{formatPoints(state.points)}</strong>
              </div>
              <div>
                <span>Generated code</span>
                <strong>{state.generatedCode || 'Not generated'}</strong>
              </div>
            </div>
            <p className="status-line">Redeemed total: {formatCurrency(state.redeemedTotal)}</p>
            <div className="actions-row">
              <button className="btn btn-primary" onClick={generateRedemptionCode}>
                Generate code
              </button>
            </div>
          </section>,
        )}

      <section className="card footer-sheet">
        <div className="footer-summary">
          <BadgeInfo size={18} />
          <p>
            TurnerHacks 2026
          </p>
        </div>
        <button className="btn btn-secondary" onClick={state.loggedIn ? logout : login}>
          {state.loggedIn ? 'Logout' : 'Log in'}
        </button>
      </section>
    </>
  );
}
