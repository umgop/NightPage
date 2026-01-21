import { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, ArrowLeft, Download, Eye, Image } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AdminDashboardProps {
  accessToken: string;
  onBack: () => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface JournalEntry {
  date: string;
  content: string;
  wordCount: number;
  duration: number;
}

export function AdminDashboard({ accessToken, onBack }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userEntries, setUserEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardImages, setDashboardImages] = useState<string[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (!files) return;

    setImageUploadLoading(true);
    const newImages: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setDashboardImages([...dashboardImages, ...newImages]);
            setImageUploadLoading(false);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setDashboardImages(dashboardImages.filter((_, i) => i !== index));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/admin/users`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEntries = async (userId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-3e97d870/admin/user/${userId}/entries`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user entries');
      }

      const data = await response.json();
      setUserEntries(data.entries);
    } catch (err: any) {
      console.error('Error fetching user entries:', err);
    }
  };

  const viewUserEntries = (user: User) => {
    setSelectedUser(user);
    fetchUserEntries(user.id);
  };

  const downloadUserEntries = () => {
    if (!selectedUser || userEntries.length === 0) return;

    const allContent = userEntries.map(entry => {
      return `${entry.date}\nWord Count: ${entry.wordCount} | Duration: ${entry.duration} min\n\n${entry.content}\n\n${'='.repeat(80)}\n\n`;
    }).join('');

    const textContent = `NightPage - ${selectedUser.name}'s Journal Archive\nEmail: ${selectedUser.email}\nTotal Entries: ${userEntries.length}\n\n${'='.repeat(80)}\n\n${allContent}`;
    
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nightpage-${selectedUser.email}-archive.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (selectedUser) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          background: '#0f0e0d',
          color: '#f2f4f3',
          overflowY: 'auto'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 24px 32px'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              paddingBottom: '24px',
              borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setUserEntries([]);
                }}
                style={{
                  color: 'rgba(74, 71, 70, 0.7)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = 'rgba(163, 149, 148, 0.7)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.color = 'rgba(74, 71, 70, 0.7)';
                }}
              >
                <ArrowLeft style={{ width: '20px', height: '20px' }} />
              </button>
              <div>
                <h1
                  style={{
                    fontSize: '24px',
                    color: '#f2f4f3',
                    fontFamily: '"Libre Baskerville", serif',
                    fontWeight: 'normal',
                    margin: '0 0 4px 0'
                  }}
                >
                  {selectedUser.name}'s Journal
                </h1>
                <p
                  style={{
                    fontSize: '14px',
                    color: 'rgba(138, 129, 128, 0.8)',
                    margin: 0
                  }}
                >
                  {selectedUser.email}
                </p>
              </div>
            </div>
            {userEntries.length > 0 && (
              <button
                onClick={downloadUserEntries}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid rgba(74, 71, 70, 0.6)',
                  color: 'rgba(163, 149, 148, 0.7)',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = '#1a1817';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = 'transparent';
                }}
              >
                <Download style={{ width: '16px', height: '16px' }} />
                <span style={{ fontSize: '14px' }}>Download All</span>
              </button>
            )}
          </div>

          {/* Entries */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {userEntries.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: '48px',
                  paddingBottom: '48px',
                  color: 'rgba(74, 71, 70, 0.7)'
                }}
              >
                No journal entries yet
              </div>
            ) : (
              userEntries.map((entry, index) => (
                <div
                  key={index}
                  style={{
                    background: '#1a1817',
                    border: '1px solid rgba(42, 38, 37, 0.6)',
                    borderRadius: '4px',
                    padding: '24px',
                    cursor: 'default',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'rgba(74, 71, 70, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = 'rgba(42, 38, 37, 0.6)';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <div
                        style={{
                          color: 'rgba(163, 149, 148, 0.7)',
                          marginBottom: '4px',
                          fontFamily: '"Spectral", serif'
                        }}
                      >
                        {entry.date}
                      </div>
                      <div style={{ fontSize: '12px', color: 'rgba(74, 71, 70, 0.7)' }}>
                        {entry.wordCount} words · {entry.duration} min session
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      color: 'rgba(138, 129, 128, 0.8)',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '240px',
                      overflowY: 'auto'
                    }}
                  >
                    {entry.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: '#0f0e0d',
        color: '#f2f4f3',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 24px 32px'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={onBack}
              style={{
                color: 'rgba(74, 71, 70, 0.7)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = 'rgba(163, 149, 148, 0.7)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.color = 'rgba(74, 71, 70, 0.7)';
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield style={{ width: '32px', height: '32px', color: 'rgba(163, 149, 148, 0.7)' }} />
              <div>
                <h1
                  style={{
                    fontSize: '28px',
                    color: '#f2f4f3',
                    fontFamily: '"Libre Baskerville", serif',
                    fontWeight: 'normal',
                    margin: '0 0 4px 0'
                  }}
                >
                  Admin Dashboard
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(138, 129, 128, 0.8)', margin: 0 }}>
                  Master access to all users and entries
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '28px',
            marginBottom: '32px'
          }}
        >
          <div
            style={{
              background: '#1a1817',
              border: '1px solid rgba(42, 38, 37, 0.6)',
              borderRadius: '4px',
              padding: '40px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Users style={{ width: '28px', height: '28px', color: 'rgba(163, 149, 148, 0.7)' }} />
              <div style={{ fontSize: '16px', color: 'rgba(138, 129, 128, 0.8)' }}>Total Users</div>
            </div>
            <div style={{ fontSize: '48px', color: '#f2f4f3', fontWeight: 'bold' }}>{users.length}</div>
          </div>
          <div
            style={{
              background: '#1a1817',
              border: '1px solid rgba(42, 38, 37, 0.6)',
              borderRadius: '4px',
              padding: '40px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <BookOpen style={{ width: '28px', height: '28px', color: 'rgba(163, 149, 148, 0.7)' }} />
              <div style={{ fontSize: '16px', color: 'rgba(138, 129, 128, 0.8)' }}>Platform</div>
            </div>
            <div style={{ fontSize: '28px', color: '#f2f4f3' }}>NightPage</div>
          </div>
          <div
            style={{
              background: '#1a1817',
              border: '1px solid rgba(42, 38, 37, 0.6)',
              borderRadius: '4px',
              padding: '40px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <Shield style={{ width: '28px', height: '28px', color: 'rgba(163, 149, 148, 0.7)' }} />
              <div style={{ fontSize: '16px', color: 'rgba(138, 129, 128, 0.8)' }}>Access Level</div>
            </div>
            <div style={{ fontSize: '28px', color: '#f2f4f3' }}>Master</div>
          </div>
        </div>

        {/* Dashboard Images Section */}
        <div
          style={{
            background: '#1a1817',
            border: '1px solid rgba(42, 38, 37, 0.6)',
            borderRadius: '4px',
            padding: '28px',
            marginBottom: '32px'
          }}
        >
          <div style={{ marginBottom: '20px' }}>
            <h2
              style={{
                fontSize: '20px',
                color: '#f2f4f3',
                fontFamily: '"Spectral", serif',
                fontWeight: 'normal',
                margin: '0 0 16px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Image style={{ width: '24px', height: '24px' }} />
              Dashboard Images
            </h2>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                background: 'transparent',
                border: '1px solid rgba(74, 71, 70, 0.6)',
                color: 'rgba(163, 149, 148, 0.7)',
                cursor: imageUploadLoading ? 'not-allowed' : 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s ease',
                fontFamily: 'inherit',
                fontSize: '14px',
                opacity: imageUploadLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!imageUploadLoading) {
                  const el = e.currentTarget as HTMLLabelElement;
                  el.style.background = '#2a2520';
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLLabelElement;
                el.style.background = 'transparent';
              }}
            >
              <Image style={{ width: '16px', height: '16px' }} />
              {imageUploadLoading ? 'Uploading...' : 'Add Images'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageUploadLoading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {dashboardImages.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: '16px'
              }}
            >
              {dashboardImages.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    border: '1px solid rgba(42, 38, 37, 0.6)',
                    aspectRatio: '1'
                  }}
                >
                  <img
                    src={image}
                    alt={`Dashboard image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(0, 0, 0, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#f2f4f3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'rgba(220, 38, 38, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'rgba(0, 0, 0, 0.6)';
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {dashboardImages.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '32px 16px',
                color: 'rgba(74, 71, 70, 0.7)'
              }}
            >
              No images yet. Click "Add Images" to get started.
            </div>
          )}
        </div>

        {/* Error state */}
        {error && (
          <div
            style={{
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              borderRadius: '4px',
              padding: '12px 16px',
              marginBottom: '24px'
            }}
          >
            <p style={{ fontSize: '14px', color: '#ff6b6b', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Users list */}
        <div
          style={{
            background: '#1a1817',
            border: '1px solid rgba(42, 38, 37, 0.6)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              borderBottom: '1px solid rgba(42, 38, 37, 0.6)'
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                color: '#f2f4f3',
                fontFamily: '"Spectral", serif',
                fontWeight: 'normal',
                margin: 0
              }}
            >
              All Users
            </h2>
          </div>

          {loading ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'rgba(74, 71, 70, 0.7)'
              }}
            >
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                padding: '48px 24px',
                textAlign: 'center',
                color: 'rgba(74, 71, 70, 0.7)'
              }}
            >
              No users yet
            </div>
          ) : (
            <div
              style={{
                borderTop: '1px solid rgba(42, 38, 37, 0.6)'
              }}
            >
              {users.map((user, index) => (
                <div
                  key={user.id}
                  style={{
                    padding: '16px 24px',
                    borderBottom: index < users.length - 1 ? '1px solid rgba(42, 38, 37, 0.3)' : 'none',
                    transition: 'background-color 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor = 'rgba(42, 38, 37, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: '#f2f4f3', marginBottom: '4px' }}>{user.name}</div>
                    <div style={{ fontSize: '14px', color: 'rgba(138, 129, 128, 0.8)' }}>{user.email}</div>
                    <div style={{ fontSize: '12px', color: 'rgba(74, 71, 70, 0.7)', marginTop: '4px' }}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => viewUserEntries(user)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(74, 71, 70, 0.6)',
                      color: 'rgba(163, 149, 148, 0.7)',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = '#1a1817';
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = 'transparent';
                    }}
                  >
                    <Eye style={{ width: '16px', height: '16px' }} />
                    <span style={{ fontSize: '14px' }}>View Entries</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
