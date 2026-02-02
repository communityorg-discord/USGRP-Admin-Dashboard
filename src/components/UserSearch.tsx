'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
    user_id: string;
    user_tag: string;
    case_count: number;
    last_case: string;
}

interface UserSearchProps {
    onSelect?: (user: SearchResult) => void;
    placeholder?: string;
}

export default function UserSearch({ onSelect, placeholder = 'Search users...' }: UserSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        
        if (query.length < 2) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setResults(data.results || []);
                    setShowDropdown(true);
                }
            } catch (e) {
                console.error('Search error:', e);
            }
            setLoading(false);
        }, 300);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    const handleSelect = (user: SearchResult) => {
        setQuery(user.user_tag || user.user_id);
        setShowDropdown(false);
        if (onSelect) onSelect(user);
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    className="form-input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    style={{ paddingRight: '36px' }}
                />
                {loading && (
                    <div style={{ 
                        position: 'absolute', 
                        right: '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        border: '2px solid var(--border-subtle)',
                        borderTopColor: 'var(--accent-primary)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                )}
                <svg 
                    style={{ 
                        position: 'absolute', 
                        right: loading ? '36px' : '12px', 
                        top: '50%', 
                        transform: 'translateY(-50%)',
                        width: '16px',
                        height: '16px',
                        color: 'var(--text-muted)',
                        pointerEvents: 'none'
                    }}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
            </div>

            {showDropdown && results.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 100,
                    maxHeight: '300px',
                    overflowY: 'auto',
                }}>
                    {results.map((user, i) => (
                        <div
                            key={user.user_id}
                            onClick={() => handleSelect(user)}
                            style={{
                                padding: '12px 16px',
                                cursor: 'pointer',
                                borderBottom: i < results.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{user.user_tag || 'Unknown'}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{user.user_id}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ 
                                        fontSize: '12px', 
                                        fontWeight: 500, 
                                        color: user.case_count > 5 ? '#ef4444' : user.case_count > 2 ? '#f59e0b' : 'var(--text-secondary)' 
                                    }}>
                                        {user.case_count} case{user.case_count !== 1 ? 's' : ''}
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                                        {user.last_case ? new Date(user.last_case).toLocaleDateString() : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <style jsx>{`
                @keyframes spin {
                    to { transform: translateY(-50%) rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
