import { useState, useEffect, useRef } from 'react';
import { Music, Volume2, VolumeX, Sparkles, Cloud, Heart, Zap, Moon, ExternalLink } from 'lucide-react';

interface MusicPlayerProps {
  isPlaying: boolean;
}

// YouTube video(s) to use for Naruto-themed tracks (will be embedded/looped)
// Default video ID provided by user: hFxCDbiPWJk
const DEFAULT_NARUTO_VIDEO_ID = 'hFxCDbiPWJk';

// Per-mood mapping: replace values with desired YouTube video IDs (or keep the default)
const MOOD_VIDEO_MAP: Record<string, string> = {
  calm: DEFAULT_NARUTO_VIDEO_ID,
  creative: DEFAULT_NARUTO_VIDEO_ID,
  focus: DEFAULT_NARUTO_VIDEO_ID,
  melancholy: DEFAULT_NARUTO_VIDEO_ID,
  energized: DEFAULT_NARUTO_VIDEO_ID,
  nocturne: DEFAULT_NARUTO_VIDEO_ID,
};

// Optional: map moods to direct audio file URLs (prefer self-hosted or permissively licensed files).
// Example: { calm: 'https://example.com/samidare.mp3', creative: 'https://...' }
// If a mood has an audio URL, the player will use an HTMLAudioElement (audio-only).
const MOOD_AUDIO_MAP: Record<string, string> = {
  calm: '',
  creative: '',
  focus: '',
  melancholy: '',
  energized: '',
  nocturne: '',
  naruto: '/naruto.mp3',
};

// Playlist tracks split by timestamps (title + start second)
const PLAYLIST_TRACKS: Array<{ title: string; start: number }> = [
  { title: 'Floating Dead Leaves', start: 1 },
  { title: 'Morning', start: 126 },
  { title: 'Silent Song', start: 216 },
  { title: "I've Seen too Much", start: 368 },
  { title: 'Daymare', start: 482 },
  { title: 'Alone', start: 599 },
  { title: 'Rain from a Cloudless Sky', start: 697 },
  { title: 'No Home', start: 832 },
  { title: 'Peaceful', start: 988 },
  { title: 'Shirohae', start: 1119 },
  { title: 'Hinata vs Neji', start: 1281 },
  { title: 'Determination', start: 1470 },
  { title: 'Loneliness', start: 1582 },
  { title: 'Little Song', start: 1704 },
  { title: 'Cloudiness', start: 1799 },
  { title: 'Autumn Light Chrysanthemum', start: 1976 },
  { title: 'Halo', start: 2074 },
  { title: 'Snow', start: 2153 },
  { title: 'The Day', start: 2266 },
  { title: 'Recollection', start: 2392 },
  { title: 'Byakuya', start: 2492 },
  { title: 'Colourfull Mist', start: 2579 },
  { title: 'Swaying Necklace', start: 2710 },
  { title: 'Oh! Student and Teacher Affection', start: 2821 },
  { title: 'Comet', start: 3014 },
  { title: 'Nostalgia', start: 3139 },
];

// Map moods to a starting track index (only Naruto uses the playlist, others use synthetic audio)
const MOOD_TRACK_START_INDEX: Record<string, number> = {
  naruto: 0,  // Start at beginning (0:01)
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
    this.masterGain.gain.value = 0.4;

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
  { id: 'spotify', name: 'Spotify Playlist', icon: Music, description: 'Your playlist link', type: 'spotify' },
  { id: 'calm', name: 'Calm', icon: Cloud, description: 'Peaceful reflection', type: 'synthetic' },
  { id: 'creative', name: 'Creative', icon: Sparkles, description: 'Unlock ideas', type: 'synthetic' },
  { id: 'focus', name: 'Focus', icon: Zap, description: 'Deep concentration', type: 'synthetic' },
  { id: 'melancholy', name: 'Melancholy', icon: Heart, description: 'Emotional processing', type: 'synthetic' },
  { id: 'energized', name: 'Energized', icon: Zap, description: 'Uplifting thoughts', type: 'synthetic' },
  { id: 'nocturne', name: 'Nocturne', icon: Moon, description: 'Late night vibes', type: 'synthetic' },
  { id: 'naruto', name: "Creator's Favorite", icon: Music, description: 'Naruto soundtrack', type: 'naruto' },
];

export function MusicPlayer({ isPlaying: propIsPlaying }: MusicPlayerProps) {
  const [currentMood, setCurrentMood] = useState('calm');
  const [isMuted, setIsMuted] = useState(false);
  const [showMoodSelector, setShowMoodSelector] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isLocalPlaying, setIsLocalPlaying] = useState(false);
  const audioGeneratorRef = useRef<MoodBasedAudioGenerator | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(MOOD_TRACK_START_INDEX['calm'] || 0);
  const [spotifyPlaylistUrl, setSpotifyPlaylistUrl] = useState<string | null>(null);
  const [showSpotifyInput, setShowSpotifyInput] = useState(false);
  const [tempSpotifyUrl, setTempSpotifyUrl] = useState<string>('');

  // Use local play state if parent doesn't provide isPlaying
  const isPlaying = propIsPlaying || isLocalPlaying;

  // Initialize the audio generator on mount and load Spotify URL
  useEffect(() => {
    audioGeneratorRef.current = new MoodBasedAudioGenerator();
    loadSpotifyPlaylist();
    return () => {
      audioGeneratorRef.current?.stop();
    };
  }, []);

  // Load Spotify playlist URL from localStorage
  const loadSpotifyPlaylist = () => {
    try {
      const stored = localStorage.getItem('nightpage_spotify_url');
      if (stored) {
        setSpotifyPlaylistUrl(stored);
        setTempSpotifyUrl(stored);
      }
    } catch (e) {
      console.error('Error loading Spotify URL:', e);
    }
  };

  // Save Spotify playlist URL
  const saveSpotifyPlaylist = () => {
    const url = tempSpotifyUrl.trim();
    if (!url) {
      alert('Please enter a valid Spotify playlist URL');
      return;
    }

    if (!url.includes('spotify.com/playlist')) {
      alert('Please enter a valid Spotify playlist URL (e.g., https://open.spotify.com/playlist/...)');
      return;
    }

    localStorage.setItem('nightpage_spotify_url', url);
    setSpotifyPlaylistUrl(url);
    setShowSpotifyInput(false);
    selectMood('spotify');
  };

  // Delete Spotify playlist
  const deleteSpotifyPlaylist = () => {
    if (!confirm('Remove Spotify playlist?')) return;
    localStorage.removeItem('nightpage_spotify_url');
    setSpotifyPlaylistUrl(null);
    setTempSpotifyUrl('');
    if (currentMood === 'spotify') {
      selectMood('calm');
    }
  };

  // Open Spotify playlist in new window
  const openSpotifyPlaylist = () => {
    if (spotifyPlaylistUrl) {
      window.open(spotifyPlaylistUrl, '_blank');
    }
  };

  const selectedMood = moods.find(m => m.id === currentMood) || moods[0];

  // Control audio playback: use synthetic generator for most moods or YouTube iframe for Naruto mood
  useEffect(() => {
    audioGeneratorRef.current?.stop();

    const audioUrl = MOOD_AUDIO_MAP[currentMood];
    const isNarutoMode = currentMood === 'naruto';
    const isSpotifyMode = currentMood === 'spotify';

    // Spotify mode: don't play audio here, just open the playlist
    if (isSpotifyMode) {
      return;
    }

    // Play direct audio URL if available
    if (isPlaying && !isMuted && userInteracted && audioUrl) {
      if (!audioRef.current) audioRef.current = new Audio();
      try {
        audioRef.current.src = audioUrl;
        audioRef.current.loop = true;
        audioRef.current.volume = 1.0;
        audioRef.current.play().catch((err) => {
          console.error('Audio play error:', err);
        });
      } catch (e) {
        console.error('Audio setup error:', e);
      }
      return () => {
        try {
          audioRef.current?.pause();
          audioRef.current = null;
        } catch (e) {}
      };
    }

    // Stop HTMLAudio if not playing
    if (!isPlaying || isMuted || !userInteracted || !audioUrl) {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch (e) {}
        audioRef.current = null;
      }
    }

    // For non-Naruto/non-Spotify moods: play synthetic generator
    if (isPlaying && !isMuted && !isNarutoMode && !isSpotifyMode && !audioUrl) {
      audioGeneratorRef.current?.start(currentMood);
    }
  }, [isPlaying, isMuted, currentMood, userInteracted]);

  // Seek Naruto track to the correct timestamp
  useEffect(() => {
    if (currentMood === 'naruto' && isPlaying && audioRef.current && audioRef.current.src) {
      const track = PLAYLIST_TRACKS[currentTrackIndex];
      if (track) {
        audioRef.current.currentTime = track.start;
      }
    }
  }, [currentTrackIndex, currentMood, isPlaying]);

  const selectMood = (moodId: string) => {
    setCurrentMood(moodId);
    setShowMoodSelector(false);
    const idx = MOOD_TRACK_START_INDEX[moodId] ?? 0;
    setCurrentTrackIndex(idx % PLAYLIST_TRACKS.length);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Beat option removed per user request.

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
        onClick={(e) => {
          // Mark that the user interacted so autoplay is allowed by browsers
          setUserInteracted(true);
          setIsLocalPlaying(!isLocalPlaying);
          setShowMoodSelector(!showMoodSelector);
        }}
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

      {/* Next track button (Naruto only) */}
      {currentMood === 'naruto' && isLocalPlaying && (
        <button
          onClick={() => {
            const nextIdx = (currentTrackIndex + 1) % PLAYLIST_TRACKS.length;
            setCurrentTrackIndex(nextIdx);
          }}
          style={{
            color: 'rgba(163, 149, 148, 0.7)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '12px',
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
          title={`Next: ${PLAYLIST_TRACKS[currentTrackIndex]?.title || 'Track'}`}
        >
          ⏭ {PLAYLIST_TRACKS[currentTrackIndex]?.title}
        </button>
      )}

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
                const isSpotifyMood = mood.id === 'spotify';
                const hasSpotifyUrl = spotifyPlaylistUrl !== null;

                // Skip Spotify mood if no URL set
                if (isSpotifyMood && !hasSpotifyUrl) {
                  return null;
                }

                return (
                  <div key={mood.id} style={{ display: 'flex', alignItems: 'stretch' }}>
                    <button
                      onClick={() => {
                        if (isSpotifyMood) {
                          openSpotifyPlaylist();
                        }
                        selectMood(mood.id);
                      }}
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
                    {/* Edit/delete button for Spotify mood */}
                    {isSpotifyMood && hasSpotifyUrl && (
                      <>
                        <button
                          onClick={() => setShowSpotifyInput(true)}
                          style={{
                            width: '40px',
                            padding: '0 8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(163, 149, 148, 0.7)',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.color = '#f2f4f3';
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.color = 'rgba(163, 149, 148, 0.7)';
                          }}
                          title="Edit Spotify URL"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => deleteSpotifyPlaylist()}
                          style={{
                            width: '40px',
                            padding: '0 8px',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(163, 149, 148, 0.7)',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onMouseEnter={(e) => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.color = '#f2f4f3';
                          }}
                          onMouseLeave={(e) => {
                            const el = e.currentTarget as HTMLButtonElement;
                            el.style.color = 'rgba(163, 149, 148, 0.7)';
                          }}
                          title="Remove Spotify URL"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              {/* Spotify URL input section */}
              {showSpotifyInput ? (
                <div
                  style={{
                    padding: '12px',
                    borderTop: '1px solid rgba(42, 38, 37, 0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <label style={{ fontSize: '12px', color: 'rgba(163, 149, 148, 0.7)' }}>
                    Spotify Playlist URL
                  </label>
                  <input
                    type="text"
                    value={tempSpotifyUrl}
                    onChange={(e) => setTempSpotifyUrl(e.target.value)}
                    placeholder="https://open.spotify.com/playlist/..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(42, 38, 37, 0.4)',
                      border: '1px solid rgba(163, 149, 148, 0.3)',
                      borderRadius: '4px',
                      color: '#f2f4f3',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setShowSpotifyInput(false)}
                      style={{
                        padding: '6px 12px',
                        background: 'transparent',
                        border: '1px solid rgba(163, 149, 148, 0.5)',
                        color: 'rgba(163, 149, 148, 0.7)',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = 'rgba(163, 149, 148, 0.8)';
                        el.style.color = '#f2f4f3';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.borderColor = 'rgba(163, 149, 148, 0.5)';
                        el.style.color = 'rgba(163, 149, 148, 0.7)';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => saveSpotifyPlaylist()}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(163, 149, 148, 0.2)',
                        border: '1px solid rgba(163, 149, 148, 0.5)',
                        color: '#f2f4f3',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontFamily: 'inherit',
                        fontSize: '12px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(163, 149, 148, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLButtonElement;
                        el.style.background = 'rgba(163, 149, 148, 0.2)';
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: '8px 12px',
                    borderTop: '1px solid rgba(42, 38, 37, 0.6)'
                  }}
                >
                  <button
                    onClick={() => {
                      setShowSpotifyInput(true);
                      setTempSpotifyUrl(spotifyPlaylistUrl || '');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'transparent',
                      border: '1px dashed rgba(163, 149, 148, 0.5)',
                      color: 'rgba(163, 149, 148, 0.7)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      fontFamily: 'inherit',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = 'rgba(163, 149, 148, 0.8)';
                      el.style.color = '#f2f4f3';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.borderColor = 'rgba(163, 149, 148, 0.5)';
                      el.style.color = 'rgba(163, 149, 148, 0.7)';
                    }}
                  >
                    <ExternalLink style={{ width: '14px', height: '14px' }} />
                    Add Spotify Playlist
                  </button>
                </div>
              )}
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
      {/* Hidden YouTube embed for Naruto-themed tracks. It will autoplay/loop when audio is enabled. */}
      {isPlaying && userInteracted && currentMood === 'naruto' && (() => {
        const videoId = MOOD_VIDEO_MAP[currentMood] || DEFAULT_NARUTO_VIDEO_ID;
        const track = PLAYLIST_TRACKS[currentTrackIndex] || PLAYLIST_TRACKS[0];
        const start = track.start || 0;
        const src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&start=${start}&loop=1&playlist=${videoId}&controls=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1`;
        return (
          <iframe
            key={videoId}
            title={`Naruto Music (${currentMood})`}
            src={src}
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              border: 0,
              overflow: 'hidden'
            }}
            allow="autoplay; encrypted-media"
            sandbox="allow-same-origin allow-scripts allow-presentation"
          />
        );
      })()}
    </div>
  );
}
