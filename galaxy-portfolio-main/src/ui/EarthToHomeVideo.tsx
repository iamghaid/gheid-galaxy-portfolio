import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../core/SceneManager';

// Plays a single video covering the journey from Earth down to home (Saudi Arabia -> Jeddah -> Al Marwah)
// instead of the interactive scroll-driven continent/city/district scenes.
// Triggers as soon as the camera finishes zooming into Earth (currentScene becomes 'continent'),
// and jumps straight to the 'room' scene once the video finishes playing.
function EarthToHomeVideo() {
  const currentScene = useSceneStore((state) => state.currentScene);
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (currentScene === 'continent') {
      setActive(true);
    } else if (currentScene !== 'city' && currentScene !== 'district') {
      // any scene outside the continent/city/district group means the video shouldn't be showing
      setActive(false);
    }

    // user scrolled backward out of the room: those in-between scenes never had their
    // camera state set up (we skipped them with the video), so jump straight back to earth
    // instead of letting them render with stale/default camera data.
    if (currentScene === 'district') {
      const { zoomDirection } = useSceneStore.getState();
      if (zoomDirection === 'out') {
        useSceneStore.setState({ currentScene: 'earth', zoomDirection: 'out', sceneZoomed: null });
      }
    }
  }, [currentScene]);

  // block scroll/touch input reaching the hidden scenes underneath while the video plays
  useEffect(() => {
    if (!active) return;

    const block = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
    };

    window.addEventListener('wheel', block, { passive: false, capture: true });
    window.addEventListener('touchstart', block, { passive: false, capture: true });
    window.addEventListener('touchmove', block, { passive: false, capture: true });

    return () => {
      window.removeEventListener('wheel', block, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchstart', block, { capture: true } as EventListenerOptions);
      window.removeEventListener('touchmove', block, { capture: true } as EventListenerOptions);
    };
  }, [active]);

  useEffect(() => {
    if (active && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {
        // autoplay might be blocked, user can tap to play via controls
      });
    }
  }, [active]);

  const handleEnded = () => {
    setActive(false);
    // skip straight to the room scene, bypassing continent/city/district
    useSceneStore.setState({ currentScene: 'room', zoomDirection: 'in', sceneZoomed: null });
  };

  const handleSkip = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    handleEnded();
  };

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'black',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        src="/assets/videos/earth-to-home.mp4"
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <button
        onClick={handleSkip}
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '30px',
          padding: '10px 20px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: '20px',
          fontFamily: 'Tektur-Regular, sans-serif',
          fontSize: '14px',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        Skip
      </button>
    </div>
  );
}

export default EarthToHomeVideo;
