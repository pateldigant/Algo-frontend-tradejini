// src/components/ToastNotification.jsx
import React, { useEffect, useState } from 'react';
import './ToastNotification.css';

const ToastNotification = ({ message, type, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  // Effect to animate the toast in and set a timer for dismissal
  useEffect(() => {
    // This ensures the component has mounted in its "hidden" state before we trigger the animation
    const fadeInTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10); // A tiny delay is enough for the browser to register the initial state

    // Set a timer to start the dismiss process
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      // Allow time for the fade-out animation before calling the parent to remove it from the DOM
      setTimeout(onDismiss, 300); // This duration MUST match the CSS transition duration
    }, 1500); // Keep the toast visible for 4 seconds

    // Cleanup timers if the component is unmounted early
    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(dismissTimer);
    };
  }, [onDismiss]);

  const toastClass = `toast-notification ${type} ${isVisible ? 'visible' : ''}`;

  return (
    <div className={toastClass}>
      {message}
    </div>
  );
};

export default ToastNotification;