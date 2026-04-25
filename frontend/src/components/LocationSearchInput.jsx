import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Loader2, Star } from 'lucide-react';
import { PRESET_LOCATIONS } from '../config/locations';
import { searchLocation, getSmartLocation } from '../utils/geoUtils';

/**
 * Location search input with autocomplete.
 *
 * Priority order for suggestions:
 *  1. Preset / custom locations (filtered by query)   ← always shown first
 *  2. External Nominatim / Photon results
 *
 * When the query is empty, only presets (+ "Use Current Location") are shown.
 */
export default function LocationSearchInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder = "Search for a location...",
}) {
  const [isOpen, setIsOpen]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [externalResults, setExternalResults] = useState([]);
  const [error, setError]       = useState(null);
  const wrapperRef              = useRef(null);
  const debounceTimer           = useRef(null);

  // ── Filtered presets (case-insensitive substring match) ────────────────────
  const filteredPresets = value && value.trim()
    ? PRESET_LOCATIONS.filter((p) =>
        p.name.toLowerCase().includes(value.trim().toLowerCase())
      )
    : PRESET_LOCATIONS;

  const hasQuery   = !!(value && value.trim());
  const showPreset = filteredPresets.length > 0;

  // ── Close dropdown on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Debounced external search (only when query is non-empty) ───────────────
  useEffect(() => {
    if (!isOpen) return;

    if (!hasQuery) {
      setExternalResults([]);
      setError(null);
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setLoading(true);
    setError(null);

    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await searchLocation(value);
        // Exclude external results that duplicate a preset (by name)
        const presetNames = new Set(
          filteredPresets.map((p) => p.name.toLowerCase())
        );
        const deduped = data.filter(
          (r) => !presetNames.has(r.name?.toLowerCase())
        );
        setExternalResults(deduped);
        if (filteredPresets.length === 0 && deduped.length === 0) {
          setError('No results found');
        }
      } catch (err) {
        if (err.name !== 'AbortError') setError('Failed to search location');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(debounceTimer.current);
  }, [value, isOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSelect = (loc) => {
    onChange(loc.name);
    setIsOpen(false);
    onSelect(loc);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setIsOpen(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          // Smart matching: snap to nearest preset within its radius,
          // only fall back to reverse geocoding when no preset matches.
          const resolved = await getSmartLocation(latitude, longitude, PRESET_LOCATIONS);
          handleSelect({
            lat: latitude,
            lng: longitude,
            name: resolved.name || 'Current Location',
          });
        } catch {
          setError('Could not get current location address.');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        setError('Location access denied.');
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ paddingLeft: '2.5rem' }}
        />
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '0.8rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            /* Force solid — override any semi-transparent --bg-card */
            background: 'var(--bg-solid, #1e1e2e)',
            backgroundColor: 'var(--bg-solid, #1e1e2e)',
            zIndex: 9999,
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)',
            marginTop: '0.5rem',
            maxHeight: '320px',
            overflowY: 'auto',
            border: '1px solid var(--border)',
            isolation: 'isolate',
          }}
        >
          {/* ── Loading spinner ───────────────────────────────────────────── */}
          {loading && (
            <div
              style={{
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-muted)',
              }}
            >
              <Loader2 size={16} className="spin" /> Searching…
            </div>
          )}

          {/* ── Error ────────────────────────────────────────────────────── */}
          {!loading && error && (
            <div style={{ padding: '1rem', color: '#ef4444', fontSize: '0.9rem' }}>
              {error}
            </div>
          )}

          {/* ── "Use Current Location" ────────────────────────────────────── */}
          {!hasQuery && (
            <div
              onClick={handleUseCurrentLocation}
              style={{
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                color: 'var(--primary)',
                fontWeight: '500',
                borderBottom: '1px solid var(--border)',
              }}
              className="hover-bg"
            >
              <Navigation size={16} /> Use Current Location
            </div>
          )}

          {/* ── Preset / custom locations section ────────────────────────── */}
          {showPreset && (
            <div>
              <div
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(0,0,0,0.03)',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <Star size={12} /> NEARBY LOCATIONS
              </div>
              {filteredPresets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelect(preset)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                  }}
                  className="hover-bg"
                >
                  <MapPin size={16} color="var(--primary)" />
                  <span style={{ flex: 1 }}>{preset.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── External / API results (de-duplicated) ───────────────────── */}
          {!loading && hasQuery && externalResults.length > 0 && (
            <div>
              <div
                style={{
                  padding: '0.4rem 1rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'rgba(0,0,0,0.03)',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
                }}
              >
                OTHER RESULTS
              </div>
              {externalResults.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelect(result)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                  }}
                  className="hover-bg"
                >
                  <div
                    style={{
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <MapPin size={16} color="var(--text-muted)" /> {result.name}
                  </div>
                  {result.address && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '1.5rem' }}>
                      {result.address}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .hover-bg:hover {
          background: var(--bg-hover) !important;
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        :root {
          --bg-hover: rgba(100, 100, 100, 0.1);
        }
      `}</style>
    </div>
  );
}
