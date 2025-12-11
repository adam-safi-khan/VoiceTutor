'use client';

/**
 * Google Places Autocomplete Component
 * Uses Google Places API for location autocomplete
 */

import { useEffect, useRef } from 'react';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
}

// Load Google Places script
const loadGooglePlacesScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.maps?.places) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places API'));
    document.head.appendChild(script);
  });
};

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'London, UK',
  className = '',
  error = false,
}: LocationAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

    if (!apiKey) {
      console.warn('Google Places API key not configured. Location autocomplete disabled.');
      return;
    }

    // Load Google Places script
    loadGooglePlacesScript(apiKey)
      .then(() => {
        if (!inputRef.current) return;

        // Initialize autocomplete
        autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['(cities)'], // Restrict to cities for cleaner results
          fields: ['formatted_address', 'address_components', 'name'],
        });

        // Listen for place selection
        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          
          if (place?.formatted_address) {
            onChange(place.formatted_address);
          } else if (place?.name) {
            onChange(place.name);
          }
        });
      })
      .catch((error) => {
        console.error('Error loading Google Places:', error);
      });

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  // Handle manual input (without selecting from dropdown)
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleManualChange}
      placeholder={placeholder}
      autoComplete="off" // Disable browser autocomplete to show Google's
      className={className}
    />
  );
}

