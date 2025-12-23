import { useState, useEffect } from 'react';
import { firebaseService, ControlData } from '@/lib/firebase';

export const useDeviceControls = () => {
  const [controlData, setControlData] = useState<ControlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeControls = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get initial data
        const initialData = await firebaseService.getControlStates();
        if (initialData) {
          setControlData(initialData);
        }

        // Set up real-time listener
        unsubscribe = firebaseService.listenToControlStates((data) => {
          setControlData(data);
        });

        setLoading(false);
      } catch (err) {
        console.error('Error initializing device controls:', err);
        setError('Failed to load device controls');
        setLoading(false);
      }
    };

    initializeControls();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const updateDeviceState = async (device: 'light' | 'fan', state: boolean) => {
    try {
      await firebaseService.updateSwitchState(device, state);
      // The real-time listener will update the state automatically
    } catch (err) {
      console.error(`Error updating ${device} state:`, err);
      setError(`Failed to update ${device} state`);
    }
  };

  return { controlData, loading, error, updateDeviceState };
};
