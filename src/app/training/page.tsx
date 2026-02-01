'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useSession } from '@/hooks/useSession';

interface TrainingModule {
    id: string;
    module_code: string;
    title: string;
    description: string;
    role_key: string;
    role_name: string;
    difficulty: string;
    estimated_minutes: number;
    passing_score: number;
    question_count: number;
    section_count: number;
    is_active: boolean;
}

interface TrainingProgress {
    id: string;
    module_id: string;
    module_code: string;
    module_title: string;
    status: string;
    sections_completed: number;
    time_spent_minutes: number;
    completed_at: string | null;
}

interface Certification {
    id: string;
    cert_code: string;
    role_key: string;
    role_name: string;
    cert_title: string;
    issued_at: string;
    expires_at: string | null;
}

interface TrainingStats {
    total_modules: number;
    total_questions: number;
    total_trainees: number;
    completed_trainings: number;
    active_certifications: number;
    avg_passing_score: number;
    passed_quizzes: number;
    failed_quizzes: number;
}

interface RoleType {
    id: string;
    role_key: string;
    role_name: string;
    description: string;
    discord_role_id: string;
    clearance_required: number;
}

export default function TrainingDashboardPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    const [modules, setModules] = useState<TrainingModule[]>([]);
    const [progress, setProgress] = useState<TrainingProgress[]>([]);
    const [certifications, setCertifications] = useState<Certification[]>([]);
    const [stats, setStats] = useState<TrainingStats | null>(null);
    const [roleTypes, setRoleTypes] = useState<RoleType[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'certifications' | 'manage'>('overview');
    const [selectedRole, setSelectedRole] = useState<string>('all');

    useEffect(() => {
        if (session) {
            fetchData();
        }
    }, [session]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modulesRes, progressRes, certsRes, statsRes, rolesRes] = await Promise.all([
                fetch('/api/training/modules').then(r => r.ok ? r.json() : { data: [] }),
                fetch('/api/training/progress?all=true').then(r => r.ok ? r.json() : { data: [] }),
                fetch('/api/training/certifications').then(r => r.ok ? r.json() : { data: [] }),
                fetch('/api/training/stats').then(r => r.ok ? r.json() : { data: null }),
                fetch('/api/training/roles').then(r => r.ok ? r.json() : { data: [] })
            ]);

            setModules(modulesRes.data || []);
            setProgress(progressRes.data || []);
            setCertifications(certsRes.data || []);
            setStats(statsRes.data);
            setRoleTypes(rolesRes.data || []);
        } catch (err) {
            console.error('Failed to fetch training data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'var(--success)';
            case 'intermediate': return 'var(--warning)';
            case 'advanced': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'var(--success)';
            case 'in_progress': return 'var(--primary)';
            case 'failed': return 'var(--danger)';
            default: return 'var(--text-muted)';
        }
    };

    const filteredModules = selectedRole === 'all' 
        ? modules 
        : modules.filter(m => m.role_key === selectedRole);

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />

            <main className="admin-main">
                <div>
                    {/* Page Header */}
                    <div className="page-header">
                        <h1 className="page-title">📚 Staff Training Center</h1>
                        <p className="page-subtitle">
                            Training modules, quizzes, and certifications for USGRP staff
                        </p>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <div style={{ display: 'flex', gap: '8px', padding: '16px' }}>
                            {(['overview', 'modules', 'certifications', 'manage'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ textTransform: 'capitalize' }}
                                >
                                    {tab === 'overview' && '📊 '}
                                    {tab === 'modules' && '📖 '}
                                    {tab === 'certifications' && '🏆 '}
                                    {tab === 'manage' && '⚙️ '}
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="card">
                            <div className="empty-state">Loading training data...</div>
                        </div>
                    ) : (
                        <>
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <>
                                    {/* Stats Grid */}
                                    <div className="stats-grid" style={{ marginBottom: '24px' }}>
                                        <div className="stat-card">
                                            <div className="stat-value">{stats?.total_modules || 0}</div>
                                            <div className="stat-label">Training Modules</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{stats?.total_trainees || 0}</div>
                                            <div className="stat-label">Staff in Training</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{stats?.completed_trainings || 0}</div>
                                            <div className="stat-label">Completed Trainings</div>
                                        </div>
                                        <div className="stat-card">
                                            <div className="stat-value">{stats?.active_certifications || 0}</div>
                                            <div className="stat-label">Active Certifications</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        {/* Quiz Performance */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h3 className="card-title">📈 Quiz Performance</h3>
                                            </div>
                                            <div style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span>Average Passing Score</span>
                                                    <strong>{stats?.avg_passing_score || 0}%</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                                    <span>Passed Quizzes</span>
                                                    <strong style={{ color: 'var(--success)' }}>{stats?.passed_quizzes || 0}</strong>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Failed Quizzes</span>
                                                    <strong style={{ color: 'var(--danger)' }}>{stats?.failed_quizzes || 0}</strong>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="card">
                                            <div className="card-header">
                                                <h3 className="card-title">🕐 Recent Progress</h3>
                                            </div>
                                            {progress.slice(0, 5).map(p => (
                                                <div key={p.id} className="case-item">
                                                    <div className="case-left">
                                                        <div className="case-info">
                                                            <h4>{p.module_title}</h4>
                                                            <p style={{ fontSize: '12px' }}>{p.module_code}</p>
                                                        </div>
                                                    </div>
                                                    <div className="case-right">
                                                        <span 
                                                            className="badge"
                                                            style={{ 
                                                                backgroundColor: getStatusColor(p.status),
                                                                color: 'white',
                                                                padding: '4px 8px',
                                                                borderRadius: '4px',
                                                                fontSize: '12px'
                                                            }}
                                                        >
                                                            {p.status.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {progress.length === 0 && (
                                                <div className="empty-state">No training activity yet</div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Modules Tab */}
                            {activeTab === 'modules' && (
                                <>
                                    {/* Role Filter */}
                                    <div className="card" style={{ marginBottom: '16px' }}>
                                        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span>Filter by role:</span>
                                            <select 
                                                value={selectedRole} 
                                                onChange={e => setSelectedRole(e.target.value)}
                                                className="form-input"
                                                style={{ width: 'auto' }}
                                            >
                                                <option value="all">All Roles</option>
                                                {roleTypes.map(r => (
                                                    <option key={r.id} value={r.role_key}>{r.role_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Modules Grid */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
                                        {filteredModules.map(module => (
                                            <div key={module.id} className="card" style={{ padding: '20px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <span style={{ 
                                                            fontFamily: 'monospace', 
                                                            fontSize: '12px', 
                                                            color: 'var(--text-muted)' 
                                                        }}>
                                                            {module.module_code}
                                                        </span>
                                                        <h3 style={{ margin: '4px 0' }}>{module.title}</h3>
                                                    </div>
                                                    <span 
                                                        style={{ 
                                                            backgroundColor: getDifficultyColor(module.difficulty),
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '11px',
                                                            textTransform: 'uppercase'
                                                        }}
                                                    >
                                                        {module.difficulty}
                                                    </span>
                                                </div>
                                                
                                                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                                                    {module.description || 'No description available'}
                                                </p>

                                                <div style={{ 
                                                    display: 'grid', 
                                                    gridTemplateColumns: '1fr 1fr', 
                                                    gap: '8px',
                                                    fontSize: '13px',
                                                    color: 'var(--text-muted)'
                                                }}>
                                                    <div>📋 {module.section_count} sections</div>
                                                    <div>❓ {module.question_count} questions</div>
                                                    <div>⏱️ {module.estimated_minutes} min</div>
                                                    <div>🎯 {module.passing_score}% to pass</div>
                                                </div>

                                                {module.role_name && (
                                                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                                                        <span style={{ 
                                                            backgroundColor: 'var(--surface-2)',
                                                            padding: '4px 10px',
                                                            borderRadius: '12px',
                                                            fontSize: '12px'
                                                        }}>
                                                            👤 {module.role_name}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {filteredModules.length === 0 && (
                                        <div className="card">
                                            <div className="empty-state">
                                                <p>No training modules found</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Certifications Tab */}
                            {activeTab === 'certifications' && (
                                <div className="card">
                                    <div className="card-header">
                                        <h3 className="card-title">🏆 Active Certifications ({certifications.length})</h3>
                                    </div>
                                    {certifications.length > 0 ? (
                                        certifications.map(cert => (
                                            <div key={cert.id} className="case-item">
                                                <div className="case-left">
                                                    <div className="official-avatar-placeholder" style={{ width: '48px', height: '48px', fontSize: '20px' }}>
                                                        🏅
                                                    </div>
                                                    <div className="case-info">
                                                        <h4>{cert.cert_title}</h4>
                                                        <p style={{ fontSize: '12px' }}>
                                                            <span style={{ fontFamily: 'monospace' }}>{cert.cert_code}</span>
                                                            {' • '}
                                                            {cert.role_name || cert.role_key}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="case-right">
                                                    <div className="case-date">
                                                        Issued {new Date(cert.issued_at).toLocaleDateString()}
                                                    </div>
                                                    {cert.expires_at && (
                                                        <div className="case-date" style={{ color: 'var(--warning)' }}>
                                                            Expires {new Date(cert.expires_at).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-state">
                                            <p>No certifications issued yet</p>
                                            <p style={{ marginTop: '8px', fontSize: '12px' }}>
                                                Staff receive certifications after completing all required training modules for their role.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Manage Tab */}
                            {activeTab === 'manage' && (
                                <>
                                    <div className="card" style={{ marginBottom: '24px' }}>
                                        <div className="card-header">
                                            <h3 className="card-title">⚙️ Training Management</h3>
                                        </div>
                                        <div style={{ padding: '20px' }}>
                                            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                                                Create and manage training modules, questions, and certifications.
                                            </p>
                                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                <button className="btn btn-primary">
                                                    ➕ Create Module
                                                </button>
                                                <button className="btn btn-secondary">
                                                    📝 Manage Questions
                                                </button>
                                                <button className="btn btn-secondary">
                                                    🏆 Issue Certification
                                                </button>
                                                <button className="btn btn-secondary">
                                                    📊 Export Reports
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role Types */}
                                    <div className="card">
                                        <div className="card-header">
                                            <h3 className="card-title">👥 Training Role Types</h3>
                                        </div>
                                        {roleTypes.map(role => (
                                            <div key={role.id} className="case-item">
                                                <div className="case-left">
                                                    <div className="case-info">
                                                        <h4>{role.role_name}</h4>
                                                        <p style={{ fontSize: '12px' }}>{role.description}</p>
                                                    </div>
                                                </div>
                                                <div className="case-right">
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        Clearance: Level {role.clearance_required}
                                                    </div>
                                                    {role.discord_role_id && (
                                                        <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                                                            Discord: {role.discord_role_id}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
