import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export const useScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('environment');
  const scannerRef = useRef(null);

  const startScanner = async () => {
    try {
      setError('');
      setScanResult(null);
      
      if (scannerRef.current) {
        scannerRef.current.stop();
      }

      scannerRef.current = new Html5Qrcode('qr-reader');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      const capabilities = stream.getVideoTracks()[0].getCapabilities?.();
      const supported = capabilities?.facingMode?.includes(facingMode);

      stream.getTracks().forEach(track => track.stop());

      await scannerRef.current.start(
        { facingMode },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setScanResult(decodedText);
          stopScanner();
        },
        (errorMessage) => {
          // Suppress QR code scanning errors
        }
      );

      setIsScanning(true);
    } catch (err) {
      setError(`Error starting scanner: ${err.message}`);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
      setIsScanning(false);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const switchCamera = async () => {
    await stopScanner();
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    
    // Restart with new camera
    setTimeout(() => {
      scannerRef.current = new Html5Qrcode('qr-reader');
      startScanner();
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return {
    isScanning,
    scanResult,
    error,
    facingMode,
    startScanner,
    stopScanner,
    switchCamera,
  };
};
