import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MapCanvas from '../components/Mapcanvas';
import SectionPanel from '../components/Sectionpanel';
import RouteCard from '../components/RouteCard';
import { getActiveRoutes } from '../services/supabase';

export default function GymMap() {
  const location = useLocation();
  const [routes, setRoutes] = useState([]);
  const [section, setSection] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    let mounted = true;
    getActiveRoutes().then(({ data }) => {
      if (!mounted) return;
      const activeRoutes = data ?? [];
      setRoutes(activeRoutes);
      const routeId = location.state?.routeId;
      if (routeId) {
        const initialRoute = activeRoutes.find(r => r.id === routeId);
        if (initialRoute) {
          setSelectedRoute(initialRoute);
        }
      }
    }).catch(() => { /* ignore for now */ });
    return () => { mounted = false; };
  }, [location.state]);

  const handleSectionSelect = (sec) => setSection(sec);
  const handleRouteSelect = (route) => setSelectedRoute(route);

  return (
    <div className="container page-content" style={{ paddingTop: '1.25rem', width: '100%', maxWidth: '100%' }}>
      <div style={{ width: '100%', minHeight: '55vh', height: '62vh' }}>
        <MapCanvas
          routes={routes}
          onSectionSelect={handleSectionSelect}
          onRouteSelect={handleRouteSelect}
        />
      </div>

      <div style={{ marginTop: '1rem' }}>
        {selectedRoute ? (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <RouteCard route={selectedRoute} onSelect={() => {}} />
            <button
              onClick={() => setSelectedRoute(null)}
              className="btn btn-ghost"
              style={{ width: '100%' }}
            >
              Back to map
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem' }}>Routes on the wall</h2>
            {routes.length === 0 ? (
              <div className="card" style={{ padding: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>No active routes available yet.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {routes.map(route => (
                  <RouteCard key={route.id} route={route} onSelect={handleRouteSelect} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <SectionPanel
        section={section}
        routes={routes}
        userSends={{}}
        onClose={() => setSection(null)}
        onRouteSelect={(r) => { setSelectedRoute(r); setSection(null); }}
      />
    </div>
  );
}
