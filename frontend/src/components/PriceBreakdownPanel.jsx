import React, { useState, useEffect, useRef } from 'react';
import {
  BASE_FARE,
  PER_KM_RATE,
  VEHICLE_MULTIPLIERS,
  calculateFinalPrice,
  calculatePeakMultiplier,
} from '../utils/priceEngine';
import { Info, TrendingUp, Fuel, Users, Car, Wallet, ChevronDown, ChevronUp, Zap } from 'lucide-react';

// ─── Animated number hook ────────────────────────────────────
function useAnimatedNumber(target, duration = 400) {
  const [displayed, setDisplayed] = useState(target);
  const rafRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(target);

  useEffect(() => {
    const from = fromRef.current;
    const to = target;
    if (from === to) return;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    startRef.current = null;

    const step = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = to;
    };

    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return displayed;
}

// ─── Tooltip component ───────────────────────────────────────
function Tooltip({ text }) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'help' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <Info size={12} style={{ color: 'var(--text-muted)', marginLeft: '3px', flexShrink: 0 }} />
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1e293b',
          color: '#f8fafc',
          fontSize: '0.72rem',
          padding: '0.4rem 0.6rem',
          borderRadius: '6px',
          whiteSpace: 'nowrap',
          maxWidth: '200px',
          whiteSpace: 'normal',
          lineHeight: 1.4,
          zIndex: 999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          pointerEvents: 'none',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Single line-item row ────────────────────────────────────
function LineItem({ icon: Icon, label, value, subtext, highlight, dim, tooltip, updated }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: '0.55rem 0',
      borderBottom: '1px dashed rgba(15,23,42,0.08)',
      opacity: dim ? 0.45 : 1,
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', flex: 1 }}>
        {Icon && (
          <Icon
            size={14}
            style={{
              color: highlight ? 'var(--primary)' : 'var(--text-muted)',
              marginTop: '2px',
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <span style={{
            fontSize: '0.82rem',
            color: highlight ? 'var(--text-main)' : 'var(--text-muted)',
            fontWeight: highlight ? '500' : '400',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            {label}
            {tooltip && <Tooltip text={tooltip} />}
          </span>
          {subtext && (
            <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
              {subtext}
            </span>
          )}
        </div>
      </div>
      <span style={{
        fontSize: '0.85rem',
        fontWeight: highlight ? '600' : '500',
        color: highlight ? 'var(--primary)' : 'var(--text-main)',
        whiteSpace: 'nowrap',
        marginLeft: '0.5rem',
        transition: 'color 0.3s ease',
        position: 'relative',
      }}>
        {value}
        {updated && (
          <span style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--primary)',
            animation: 'pulse 1s ease-out forwards',
          }} />
        )}
      </span>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────
/**
 * PriceBreakdownPanel
 *
 * Props:
 *   distanceKm    {number|null}
 *   vehicleType   {'Auto'|'Cab'}
 *   seats         {number}          — total seats offered by driver
 *   departureTime {string}          — datetime-local string
 *   onSuggestedPrice {(price:number) => void}  — callback to sync price into form
 */
export default function PriceBreakdownPanel({
  distanceKm,
  vehicleType = 'Auto',
  seats = 3,
  departureTime,
  onSuggestedPrice,
}) {
  const [breakdown, setBreakdown] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flashKeys, setFlashKeys] = useState({});
  const prevBreakdown = useRef(null);

  // Fuel cost estimate: ₹6/km for Auto, ₹9/km for Cab
  const FUEL_RATE = vehicleType === 'Cab' ? 9 : 6;

  useEffect(() => {
    if (!distanceKm || distanceKm <= 0) {
      setBreakdown(null);
      return;
    }

    const currentTime = departureTime ? new Date(departureTime) : new Date();

    const result = calculateFinalPrice({
      distance: distanceKm,
      vehicleType,
      totalSeats: seats,
      seatsFilled: seats,
      seatsRequestedByUser: 1,
      currentTime,
    });

    const fuelEstimate = Math.round(distanceKm * FUEL_RATE);
    const baseCostTotal = Math.round(BASE_FARE + distanceKm * PER_KM_RATE);
    const vehicleMultiplier = VEHICLE_MULTIPLIERS[vehicleType] ?? 1.0;
    const vehicleAdjusted = Math.round(baseCostTotal * vehicleMultiplier);

    const totalCost = result.totalRidePrice;
    const pricePerSeat = Math.round(totalCost / Math.max(seats, 1));
    const minPrice = Math.max(30, Math.round(totalCost * 0.9));
    const maxPrice = Math.round(totalCost * 1.15);
    const suggested = Math.round(totalCost);

    const newBreakdown = {
      distanceKm: distanceKm.toFixed(1),
      baseFare: BASE_FARE,
      perKmRate: PER_KM_RATE,
      distanceCost: Math.round(distanceKm * PER_KM_RATE),
      fuelEstimate,
      vehicleType,
      vehicleMultiplier,
      vehicleAdjusted,
      baseCostTotal,
      seats,
      totalCost,
      pricePerSeat,
      minPrice,
      maxPrice,
      suggested,
      isPeak: result.isPeakHour,
      peakMultiplier: result.peakMultiplier,
    };

    // Detect changed keys for flash animation
    if (prevBreakdown.current) {
      const changed = {};
      Object.keys(newBreakdown).forEach(k => {
        if (newBreakdown[k] !== prevBreakdown.current[k]) changed[k] = true;
      });
      setFlashKeys(changed);
      setTimeout(() => setFlashKeys({}), 1200);
    }

    prevBreakdown.current = newBreakdown;
    setBreakdown(newBreakdown);

    if (onSuggestedPrice) onSuggestedPrice(suggested, minPrice, maxPrice);
  }, [distanceKm, vehicleType, seats, departureTime]);

  // Animated values for key numbers
  const animatedPricePerSeat = useAnimatedNumber(breakdown?.pricePerSeat ?? 0);
  const animatedMin = useAnimatedNumber(breakdown?.minPrice ?? 0);
  const animatedMax = useAnimatedNumber(breakdown?.maxPrice ?? 0);
  const animatedTotal = useAnimatedNumber(breakdown?.totalCost ?? 0);

  // ── Render: No route yet ─────────────────────────────────
  if (!breakdown) {
    return (
      <div className="glass-card" style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        background: 'rgba(248, 250, 252, 0.9)',
        borderRadius: '14px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Wallet size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            Price Breakdown
          </span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          padding: '1.25rem',
          background: 'rgba(36,138,82,0.05)',
          borderRadius: '10px',
          border: '1px dashed rgba(36,138,82,0.25)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: '2rem' }}>🗺️</span>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Select a pickup &amp; destination to see a transparent, real-time fare estimate.
          </span>
        </div>
        {/* Skeleton rows */}
        {[80, 65, 90, 55].map((w, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.45rem 0',
            borderBottom: '1px dashed rgba(15,23,42,0.06)',
          }}>
            <div style={{ height: '12px', width: `${w}%`, background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
            <div style={{ height: '12px', width: '20%', background: 'rgba(15,23,42,0.06)', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  // ── Render: Full breakdown ───────────────────────────────
  return (
    <>
      <style>{`
        @keyframes pulse {
          0%   { transform: scale(1); opacity: 1; }
          50%  { transform: scale(1.8); opacity: 0.6; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes flashGreen {
          0%   { background: rgba(36,138,82,0.18); }
          100% { background: transparent; }
        }
        .pbd-flash {
          animation: flashGreen 1.0s ease-out;
        }
        .pbd-row-enter {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      <div className="glass-card" style={{
        padding: '0',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: '14px',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
      }}>

        {/* ── Header ────────────────────────────────────── */}
        <div
          onClick={() => setIsCollapsed(c => !c)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.25rem',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={16} style={{ color: 'white' }} />
            <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'white' }}>
              Price Breakdown
            </span>
            {breakdown.isPeak && (
              <span style={{
                background: 'rgba(255,255,255,0.25)',
                color: 'white',
                fontSize: '0.68rem',
                fontWeight: '600',
                padding: '0.15rem 0.45rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
              }}>
                <Zap size={10} /> PEAK
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'white' }}>
              ₹{animatedMin}–₹{animatedMax}
            </span>
            {isCollapsed
              ? <ChevronDown size={16} style={{ color: 'white' }} />
              : <ChevronUp size={16} style={{ color: 'white' }} />}
          </div>
        </div>

        {/* ── Body (collapsible) ────────────────────────── */}
        {!isCollapsed && (
          <div style={{ padding: '1rem 1.25rem', animation: 'slideIn 0.25s ease-out' }}>

            {/* Why this price? */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.9rem',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
            }}>
              <Info size={12} style={{ color: 'var(--primary)' }} />
              <span>
                {breakdown.seats > 0 ? (
                  <>Total trip cost split equally across <strong>{breakdown.seats}</strong> seat{breakdown.seats !== 1 ? 's' : ''}.</>
                ) : (
                  <>Private ride. No extra seats offered.</>
                )}
              </span>
            </div>

            {/* ── Line Items ───────────────────────────── */}

            {/* Distance */}
            <LineItem
              icon={TrendingUp}
              label="Distance"
              subtext={`${breakdown.distanceKm} km × ₹${breakdown.perKmRate}/km`}
              value={`₹${breakdown.distanceCost}`}
              tooltip="Per-km rate applied to total route distance."
              updated={flashKeys.distanceCost}
            />

            {/* Base Fare */}
            <LineItem
              icon={Wallet}
              label="Base Fare"
              subtext="Fixed component for every ride"
              value={`+ ₹${breakdown.baseFare}`}
              tooltip="Every ride starts with a flat base fare that covers pickup overhead."
              updated={flashKeys.baseFare}
            />

            {/* Fuel estimate */}
            <LineItem
              icon={Fuel}
              label="Fuel Estimate"
              subtext={`~₹${vehicleType === 'Cab' ? 9 : 6}/km × ${breakdown.distanceKm} km`}
              value={`≈ ₹${breakdown.fuelEstimate}`}
              dim
              tooltip="Estimated fuel cost for this distance. Included in base cost — shown for transparency."
              updated={flashKeys.fuelEstimate}
            />

            {/* Vehicle multiplier */}
            {breakdown.vehicleMultiplier !== 1.0 && (
              <LineItem
                icon={Car}
                label={`${breakdown.vehicleType} Multiplier`}
                subtext={`${breakdown.vehicleMultiplier}× applied to base cost`}
                value={`× ${breakdown.vehicleMultiplier}`}
                tooltip={`${breakdown.vehicleType === 'Cab' ? 'Cabs have higher operating costs than Autos.' : 'No multiplier for Autos.'}`}
                updated={flashKeys.vehicleMultiplier}
              />
            )}

            {/* Peak hour */}
            {breakdown.isPeak && (
              <LineItem
                icon={Zap}
                label="Peak Hour Demand"
                subtext="High demand at this departure time"
                value={`× ${breakdown.peakMultiplier}`}
                tooltip="Fares increase slightly during morning (8–11am) and evening (5–9pm) rush hours."
                updated={flashKeys.isPeak}
              />
            )}

            {/* Divider: subtotal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0.6rem 0.75rem',
              margin: '0.5rem 0',
              background: 'rgba(36,138,82,0.07)',
              borderRadius: '8px',
              fontSize: '0.83rem',
              fontWeight: '600',
            }}>
              <span style={{ color: 'var(--text-main)' }}>Total Ride Cost</span>
              <span style={{ color: 'var(--primary)' }}>₹{animatedTotal}</span>
            </div>

            {/* Seat split (only if seats > 0) */}
            {breakdown.seats > 0 && (
              <LineItem
                icon={Users}
                label="Seat Split"
                subtext={`₹${animatedTotal} ÷ ${breakdown.seats} seat${breakdown.seats !== 1 ? 's' : ''}`}
                value={`₹${animatedPricePerSeat} / seat`}
                dim
                tooltip="Total ride cost divided equally by the number of seats offered."
                updated={flashKeys.pricePerSeat}
              />
            )}

            {/* ── Final price range ────────────────────── */}
            <div style={{
              marginTop: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(36,138,82,0.08) 0%, rgba(37,114,135,0.08) 100%)',
              border: '1.5px solid rgba(36,138,82,0.25)',
            }}
              className={flashKeys.minPrice || flashKeys.maxPrice ? 'pbd-flash' : ''}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                    Suggested Price Range
                  </div>
                  <div style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    letterSpacing: '-0.03em',
                    lineHeight: 1.1,
                  }}>
                    ₹{animatedMin} — ₹{animatedMax}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    for trip · fair &amp; transparent
                  </div>
                </div>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Wallet size={20} style={{ color: 'white' }} />
                </div>
              </div>

              {/* Breakdown sentence */}
              <div style={{
                marginTop: '0.6rem',
                paddingTop: '0.6rem',
                borderTop: '1px dashed rgba(36,138,82,0.2)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.6,
              }}>
                <strong style={{ color: 'var(--text-main)' }}>{breakdown.distanceKm} km</strong>
                {' × ₹'}{breakdown.perKmRate} + ₹{breakdown.baseFare} base
                {breakdown.vehicleMultiplier !== 1.0 && ` × ${breakdown.vehicleMultiplier} (${breakdown.vehicleType})`}
                {' = ₹'}<strong style={{ color: 'var(--primary)' }}>{breakdown.totalCost}</strong> total
              </div>
            </div>

            {/* Footer note */}
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginTop: '0.75rem',
              lineHeight: 1.5,
              textAlign: 'center',
            }}>
              No platform fee — this is the full trip price. 100% goes to the vehicle owner.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
