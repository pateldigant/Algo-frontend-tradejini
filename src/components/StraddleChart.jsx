// src/components/StraddleChart.jsx
import React, { useEffect, useRef, useState } from "react";
import { createChart, LineSeries } from 'lightweight-charts';

// Helper: Get ATM strike
function getATMStrike(optionChain, spotPrice) {
  if (!optionChain || !spotPrice) return null;
  // Find closest strike
  let strikes = Object.keys(optionChain).map(Number);
  let atm = strikes.reduce((prev, curr) => Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev);
  return atm;
}

// Helper: Get straddle price (CE + PE at ATM)
function getStraddlePrice(optionChain, atmStrike) {
  if (!optionChain || !atmStrike) return null;
  // Defensive: Some APIs use string keys, some use numbers
  const ce = optionChain[atmStrike]?.CE?.ltp ?? optionChain[String(atmStrike)]?.CE?.ltp;
  const pe = optionChain[atmStrike]?.PE?.ltp ?? optionChain[String(atmStrike)]?.PE?.ltp;
  // Debug log
  // console.log('ATM:', atmStrike, 'CE:', ce, 'PE:', pe);
  if (ce == null || pe == null) return null;
  return Number(ce) + Number(pe);
}

// Helper: Format time for x-axis
function formatTime(date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

// Helper: Get market open/close times
function getMarketTimes() {
  const today = new Date();
  today.setHours(9, 15, 0, 0);
  const open = new Date(today);
  today.setHours(15, 30, 0, 0);
  const close = new Date(today);
  return { open, close };
}

const StraddleChart = ({ optionChain, spotPrice }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRef = useRef();
  const [dataPoints, setDataPoints] = useState([]);

  // On every update, add new straddle price point
  useEffect(() => {
    if (!optionChain || !spotPrice) return;
    const atmStrike = getATMStrike(optionChain, spotPrice);
    const straddlePrice = getStraddlePrice(optionChain, atmStrike);
    if (straddlePrice == null) return;
    const now = new Date();
    const { open, close } = getMarketTimes();
    if (now < open || now > close) return;
    // If market just opened, clear previous data
    if (now.getHours() === 9 && now.getMinutes() === 15 && dataPoints.length > 0) {
      setDataPoints([]);
      return;
    }
    // Use time in 'YYYY-MM-DDTHH:MM:SSZ' format for lightweight-charts v4+ (or unix timestamp)
    // We'll use unix timestamp for compatibility
    const time = Math.floor(now.getTime() / 1000);
    // Debug log
    // console.log('Time:', time, 'ATM:', atmStrike, 'CE:', optionChain[atmStrike]?.CE?.ltp, 'PE:', optionChain[atmStrike]?.PE?.ltp, 'Straddle:', straddlePrice);
    setDataPoints(prev => {
      if (prev.length > 0 && Math.abs(prev[prev.length-1].time - time) < 30) return prev; // avoid duplicate points within 30s
      return [...prev, { time, value: straddlePrice }];
    });
  }, [optionChain, spotPrice]);

  // Chart setup
  useEffect(() => {
    if (!chartContainerRef.current) return;
    if (!chartRef.current) {
      try {
        chartRef.current = createChart(chartContainerRef.current, {
          width: chartContainerRef.current.offsetWidth,
          height: 220,
          layout: { background: { color: '#fff' }, textColor: '#222' },
          grid: { vertLines: { color: '#eee' }, horzLines: { color: '#eee' } },
          timeScale: {
            timeVisible: true,
            secondsVisible: false,
            minBarSpacing: 10,
            borderColor: '#ccc',
          },
          rightPriceScale: { borderColor: '#ccc' },
        });
        // Use addSeries(LineSeries) as per latest API
        seriesRef.current = chartRef.current.addSeries(LineSeries, { color: '#007bff', lineWidth: 2 });
      } catch (err) {
        console.error('Error initializing lightweight-charts:', err);
      }
    }
    // Resize chart on window resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.offsetWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update chart data
  useEffect(() => {
    if (seriesRef.current && dataPoints.length > 0) {
      seriesRef.current.setData(dataPoints);
    }
  }, [dataPoints]);

  // X-axis: 9:15 to 15:30
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current || dataPoints.length === 0) return;
    const { open, close } = getMarketTimes();
    try {
      const timeScale = chartRef.current.timeScale();
      if (timeScale && typeof timeScale.setVisibleRange === 'function') {
        timeScale.setVisibleRange({
          from: Math.floor(open.getTime() / 1000),
          to: Math.floor(close.getTime() / 1000),
        });
      }
    } catch (err) {
      console.error('Error setting chart visible range:', err);
    }
  }, [dataPoints]);

  return (
    <div ref={chartContainerRef} style={{ width: '100%', height: '220px' }} />
  );
};

export default StraddleChart;
