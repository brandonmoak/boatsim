import React, { useEffect, useState } from 'react';
import { PGNEmitter } from '../core/PGNEmitter';
import { usePGNStore } from '../stores/pgnStore';
import { useEmitterStore } from '../stores/emitterStore';
import StreamLogPanel from './StreamLogPanel';

interface EmitterControllerProps {
}

const EmitterController: React.FC<EmitterControllerProps> = ({
}) => {
  const [pgnEmitter, setPgnEmitter] = useState<PGNEmitter | null>(null);
  const { pgnRates, fetchPGNDefinitions, fetchPGNState } = usePGNStore();
  const { PGNsToStream, isEmitting, showStreamLog } = useEmitterStore();

  // Initialize PGNEmitter
  useEffect(() => {
    const emitter = new PGNEmitter(
      fetchPGNState,
      pgnRates,
    );
    setPgnEmitter(emitter);

    // Cleanup on unmount
    return () => {
      emitter.stop();
    };
  }, [fetchPGNDefinitions, fetchPGNState, PGNsToStream, pgnRates]); // Empty dependency array as we only want to initialize once

  // Handle PGN selection changes
  useEffect(() => {
    pgnEmitter?.updateSelectedPGNs();
  }, [PGNsToStream, pgnEmitter]);

  // Update rates when they change
  useEffect(() => {
    if (pgnEmitter) {
      Object.entries(pgnRates).forEach(([pgnKey, rate]) => {
        pgnEmitter.updateRate(pgnKey, rate);
      });
    }
  }, [pgnRates, pgnEmitter]);

  // Handle simulation state changes
  useEffect(() => {
    if (pgnEmitter) {
      if (isEmitting) {
        pgnEmitter.start();
      } else {
        pgnEmitter.stop();
      }
    }
  }, [isEmitting, pgnEmitter]);

  return (
    <>
      {showStreamLog && <StreamLogPanel />}
    </>
  );
};

export default EmitterController; 