import { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Sparkles, Cloud, Heart, Zap, Moon, ArrowRight } from 'lucide-react';

interface MusicPlayerProps {
  isPlaying: boolean;
}

// Subtle beat URLs (use your own hosted low-volume loops)
const LOFI_BEATS: Record<string, string> = {
  calm: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  creative: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  focus: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  melancholy: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  energized: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  nocturne: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
};

// Mood-based audio generator inspired by brain.fm
class MoodBasedAudioGenerator {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private currentMood: string = 'calm';

  start(mood: string) {
    this.stop(); // Clean up any existing audio
    this.currentMood = mood;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.12;

    const moodConfig = this.getMoodConfig(mood);
    this.createOscillators(moodConfig);
  }

  private getMoodConfig(mood: string) {
    const configs: Record<string, any> = {
      calm: {
        frequencies: [174, 261.63, 329.63, 392], // Calming lower frequencies
        waveType: 'sine' as OscillatorType,
        tempo: 0.8,
        harmonics: 3,
        noiseAmount: 0.015,
      },
      creative: {
        frequencies: [261.63, 293.66, 329.63, 392, 440], // C Major scale
        waveType: 'triangle' as OscillatorType,
        tempo: 1.2,
        harmonics: 4,
        noiseAmount: 0.012,
      },
      focus: {
        frequencies: [110, 146.83, 220, 293.66], // Binaural-inspired
        waveType: 'sine' as OscillatorType,
        tempo: 1.0,
        harmonics: 2,
        noiseAmount: 0.01,
      },
      melancholy: {
        frequencies: [220, 246.94, 277.18, 329.63], // Minor tones
        waveType: 'sine' as OscillatorType,
        tempo: 0.6,
        harmonics: 3,
        noiseAmount: 0.02,
      },
      energized: {
        frequencies: [293.66, 349.23, 392, 440, 493.88], // Uplifting progression
        waveType: 'sawtooth' as OscillatorType,
        tempo: 1.5,
        harmonics: 4,
        noiseAmount: 0.012,
      },
      nocturne: {
        frequencies: [130.81, 164.81, 196, 246.94], // Deep night tones
        waveType: 'sine' as OscillatorType,
        tempo: 0.5,
        harmonics: 2,
        noiseAmount: 0.018,
      },
    };

    return configs[mood] || configs.calm;
  }

  private createOscillators(config: any) {
    if (!this.audioContext || !this.masterGain) return;

    config.frequencies.forEach((freq: number, index: number) => {
      // Main oscillator
      const osc = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      osc.type = config.waveType;
      osc.frequency.value = freq;
      
      // LFO for subtle modulation
      const lfo = this.audioContext!.createOscillator();
      const lfoGain = this.audioContext!.createGain();
      lfo.frequency.value = 0.1 + (index * 0.05) * config.tempo; // Slow modulation
      lfoGain.gain.value = 2;
      
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      // Volume envelope with varied amplitudes
      oscGain.gain.value = 0;
      const attackTime = 2 + (index * 0.5);
      oscGain.gain.linearRampToValueAtTime(
        0.15 / (index + 1),
        this.audioContext!.currentTime + attackTime
      );
      
      osc.connect(oscGain);
      oscGain.connect(this.masterGain!);
      
      osc.start();
      lfo.start();
      
      this.oscillators.push(osc, lfo);
    });

    // Add filtered noise for texture
    this.addNoise(config.noiseAmount || 0.015);
  }

  private addNoise(noiseAmount: number = 0.015) {
    if (!this.audioContext || !this.masterGain) return;

    const bufferSize = 2 * this.audioContext.sampleRate;
    const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    // Filter the noise
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    filter.Q.value = 1;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = noiseAmount;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  stop() {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Already stopped
      }
    });
    this.oscillators = [];

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  setVolume(volume: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = volume;
    }
  }
}

const moods = [
  { id: 'calm', name: 'Calm', icon: Cloud, description: 'Peaceful reflection', type: 'synthetic' },
  { id: 'creative', name: 'Creative', icon: Sparkles, description: 'Unlock ideas', type: 'synthetic' },
  { id: 'focus', name: 'Focus', icon: Zap, description: 'Deep concentration', type: 'synthetic' },
  { id: 'melancholy', name: 'Melancholy', icon: Heart, description: 'Emotional processing', type: 'synthetic' },
  { id: 'energized', name: 'Energized', icon: Zap, description: 'Uplifting thoughts', type: 'synthetic' },
  { id: 'nocturne', name: 'Nocturne', icon: Moon, description: 'Late night vibes', type: 'synthetic' },
];

export function MusicPlayer({ isPlaying }: MusicPlayerProps) {
  const [currentMood, setCurrentMood] = useState('calm');
  const [isMuted, setIsMuted] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [beatEnabled, setBeatEnabled] = useState(false);
  const previousMoodRef = useRef<string | null>(null);
  const audioGeneratorRef = useRef<MoodBasedAudioGenerator | null>(null);
  const audioBeatRef = useRef<HTMLAudioElement | null>(null);

  const selectedMood = moods.find(m => m.id === currentMood) || moods[0];

  // Initialize audio generator
  useEffect(() => {
    audioGeneratorRef.current = new MoodBasedAudioGenerator();
    
    return () => {
      audioGeneratorRef.current?.stop();
      if (audioBeatRef.current) {
        audioBeatRef.current.pause();
        audioBeatRef.current = null;
      }
    };
  }, []);

  // Control audio playback
  useEffect(() => {
    // Handle synthetic ambient audio (always on when playing & unmuted)
    if (isPlaying && !isMuted) {
      audioGeneratorRef.current?.start(currentMood);
    } else {
      audioGeneratorRef.current?.stop();
    }

    // Handle subtle beat layer (optional)
    if (!beatEnabled || isMuted || !isPlaying) {
      if (audioBeatRef.current) audioBeatRef.current.pause();
      return;
    }

    if (!audioBeatRef.current) {
      audioBeatRef.current = new Audio();
      audioBeatRef.current.loop = true;
      audioBeatRef.current.volume = 0.08; // extra subtle
    }

    audioBeatRef.current.src = LOFI_BEATS[currentMood] || LOFI_BEATS.calm;
    audioBeatRef.current.play().catch(() => {
      /* ignore play errors (autoplay restrictions) */
    });
  }, [isPlaying, isMuted, currentMood, beatEnabled]);

  const selectMood = (moodId: string) => {
    setCurrentMood(moodId);
    setShowMoodSelector(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const enableBeatForMood = (moodId: string) => {
    previousMoodRef.current = currentMood;
    setCurrentMood(moodId);
    setBeatEnabled(true);
  };

  const handleArrowClick = (moodId: string) => {
    if (beatEnabled && currentMood === moodId) {
      if (previousMoodRef.current) {
        setCurrentMood(previousMoodRef.current);
      }
      setBeatEnabled(false);
      setShowMoodSelector(false);
      return;
    }
    enableBeatForMood(moodId);
    setShowMoodSelector(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}
    >
      {/* Music icon and mood info */}
      <button
        onClick={() => setShowMoodSelector(!showMoodSelector)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'rgba(163, 149, 148, 0.7)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = '#f2f4f3';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = 'rgba(163, 149, 148, 0.7)';
        }}
      >
        <Music style={{ width: '20px', height: '20px' }} />
        <div
          style={{
            display: 'none'
          }}
        >
          <div
            style={{
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {selectedMood.name}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(74, 71, 70, 0.7)',
              marginTop: '4px',
              transition: 'color 0.2s ease'
            }}
          >
            {isPlaying && !isMuted ? 'Playing' : 'Paused'}
          </div>
        </div>
      </button>

      {/* Mute toggle */}
      <button
        onClick={toggleMute}
        style={{
          color: 'rgba(163, 149, 148, 0.7)',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'color 0.2s ease'
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = '#f2f4f3';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.color = 'rgba(163, 149, 148, 0.7)';
        }}
      >
        {isMuted ? (
          <VolumeX style={{ width: '20px', height: '20px' }} />
        ) : (
          <Volume2 style={{ width: '20px', height: '20px' }} />
        )}
      </button>

      {/* Mood selector dropdown */}
      {showMoodSelector && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 40
            }}
            onClick={() => setShowMoodSelector(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              width: '288px',
              background: '#1a1817',
              border: '1px solid rgba(74, 71, 70, 0.5)',
              borderRadius: '4px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                padding: '12px',
                borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
              }}
            >
              <div style={{ fontSize: '14px', color: 'rgba(163, 149, 148, 0.7)' }}>Select Your Mood</div>
              <div style={{ fontSize: '12px', color: 'rgba(74, 71, 70, 0.6)', marginTop: '4px' }}>
                Choose ambient sounds to match your state of mind
              </div>
            </div>
            <div
              style={{
                maxHeight: '384px',
                overflowY: 'auto'
              }}
            >
              {moods.map((mood) => {
                const Icon = mood.icon;
                const isSelected = mood.id === currentMood;
                const isBeatActive = beatEnabled && currentMood === mood.id;
                return (
                  <div key={mood.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                    <button
                      onClick={() => selectMood(mood.id)}
                      style={{
                        flex: 1,
                        textAlign: 'left',
                        padding: '12px 12px 12px 16px',
                        background: isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent',
                        border: 'none',
                        color: isSelected ? '#f2f4f3' : 'rgba(138, 129, 128, 0.8)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'background-color 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(42, 38, 37, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = isSelected ? 'rgba(42, 38, 37, 0.6)' : 'transparent';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                      >
                        <Icon style={{ width: '20px', height: '20px', color: 'rgba(163, 149, 148, 0.7)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{mood.name}</div>
                          <div style={{ fontSize: '12px', color: 'rgba(74, 71, 70, 0.6)' }}>{mood.description}</div>
                        </div>
                        {isSelected && (
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              background: 'rgba(163, 149, 148, 0.7)',
                              borderRadius: '50%',
                              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                            }}
                          />
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArrowClick(mood.id);
                      }}
                      style={{
                        width: 48,
                        border: 'none',
                        background: isBeatActive ? 'rgba(42, 38, 37, 0.9)' : 'transparent',
                        borderLeft: '1px solid rgba(42, 38, 37, 0.6)',
                        color: isBeatActive ? '#f2f4f3' : 'rgba(138, 129, 128, 0.8)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background-color 0.2s ease'
                      }}
                      title={isBeatActive ? 'Beat on' : 'Add subtle beat'}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        if (!isBeatActive) el.style.background = 'rgba(42, 38, 37, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = isBeatActive ? 'rgba(42, 38, 37, 0.9)' : 'transparent';
                      }}
                    >
                      <ArrowRight style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div
              style={{
                padding: '12px',
                borderTop: '1px solid rgba(42, 38, 37, 0.6)',
                fontSize: '12px',
                color: 'rgba(74, 71, 70, 0.6)',
                textAlign: 'center'
              }}
            >
              Generative soundscapes powered by Web Audio API
            </div>
          </div>
        </>
      )}
    </div>
  );
}
