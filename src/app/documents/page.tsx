'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Modal from '@/components/Modal';
import { useSession } from '@/hooks/useSession';

interface Document {
    id: number;
    title: string;
    description: string;
    category: string;
    file_type: string;
    file_size: number;
    created_at: string;
    access_level: string;
    role: 'owner' | 'viewer';
}

interface Folder {
    id: number;
    name: string;
    parent_id: number | null;
    role: 'owner' | 'viewer';
}

// SVG Icons
const Icons = {
    Search: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
    ),
    Grid: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
        </svg>
    ),
    List: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    FolderPlus: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
    ),
    Upload: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
    ),
    Drive: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    ),
    Users: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Trash: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Folder: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    ),
    File: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
        </svg>
    ),
    Image: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Download: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    ),
    Share: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
    ),
    MoreVertical: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    ),
    X: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    ChevronRight: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
        </svg>
    ),
    Plus: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
};

export default function DocumentsPage() {
    const { session, loading: sessionLoading, logout } = useSession();
    
    // Data State
    const [documents, setDocuments] = useState<Document[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [folderPath, setFolderPath] = useState<{id: number, name: string}[]>([]);
    const [currentFolder, setCurrentFolder] = useState<number | null>(null);
    const [viewSection, setViewSection] = useState<'my-drive' | 'shared' | 'trash'>('my-drive');
    
    // UI State
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [contextMenu, setContextMenu] = useState<{x: number, y: number, item: {type: 'file'|'folder', id: number, name?: string} } | null>(null);
    const [selectedItem, setSelectedItem] = useState<{type: 'file'|'folder', data: Document | Folder} | null>(null);
    const [sharingTarget, setSharingTarget] = useState<{type: 'file'|'folder', id: number} | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Modals
    const [showUpload, setShowUpload] = useState(false);
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showRename, setShowRename] = useState(false);
    
    // Forms & Inputs
    const [newFolderName, setNewFolderName] = useState('');
    const [renameValue, setRenameValue] = useState('');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [shareEmail, setShareEmail] = useState('');
    
    // Status
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Drag & Drop
    const [draggedItem, setDraggedItem] = useState<{type: 'file'|'folder', id: number} | null>(null);
    const [dragOver, setDragOver] = useState<number | 'root' | null>(null);

    // Permissions
    const [sharePermissions, setSharePermissions] = useState<{id: number, email: string}[]>([]);
    const [permissionOwner, setPermissionOwner] = useState<{id: string, name: string, isMe: boolean} | null>(null);
    const [permissionLoading, setPermissionLoading] = useState(false);

    // Fetch Content
    const fetchContent = async () => {
        if (!session?.userId) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({ 
                email: session.email || '',
                search: search,
                folderId: currentFolder ? currentFolder.toString() : 'root',
                trash: viewSection === 'trash' ? 'true' : 'false'
            });
            const res = await fetch(`/api/documents/list?${query}`);
            const data = await res.json();
            
            if (data.ok) {
                let docs = data.documents || [];
                let flds = data.folders || [];

                if (viewSection === 'shared') {
                    docs = docs.filter((d: Document) => d.role === 'viewer');
                    flds = flds.filter((f: Folder) => f.role === 'viewer');
                } else if (viewSection === 'my-drive' || viewSection === 'trash') {
                    docs = docs.filter((d: Document) => d.role === 'owner');
                    flds = flds.filter((f: Folder) => f.role === 'owner');
                }

                setDocuments(docs);
                setFolders(flds);
            }
        } catch (error) {
            console.error('Fetch error:', error);
        }
        setLoading(false);
    };

    // Effects
    useEffect(() => {
        if (session?.userId) fetchContent();
    }, [session, currentFolder, viewSection]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    // Handlers
    const enterFolder = (folder: Folder) => {
        setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
        setCurrentFolder(folder.id);
        setSelectedItem(null);
    };

    const handleContextMenu = (e: React.MouseEvent, type: 'file'|'folder', id: number, name?: string) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ x: e.pageX, y: e.pageY, item: { type, id, name } });
    };

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!uploadFile || !session?.userId) return;

        setUploadStatus('uploading');
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('userId', session.userId);
        if (currentFolder) formData.append('folderId', currentFolder.toString());

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/documents/upload');
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                setUploadStatus('success');
                setTimeout(() => {
                    setShowUpload(false);
                    setUploadStatus('idle');
                    setUploadFile(null);
                    fetchContent();
                }, 1000);
            } else {
                setUploadStatus('error');
            }
        };
        xhr.send(formData);
    };

    const handleCreateFolder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFolderName) return;
        await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: newFolderName, userId: session?.userId, parentId: currentFolder })
        });
        setShowCreateFolder(false);
        setNewFolderName('');
        fetchContent();
    };

    const handleDelete = async () => {
        if (!contextMenu) return;
        if (!confirm(`Are you sure you want to delete "${contextMenu.item.name}"?`)) return;

        const endpoint = contextMenu.item.type === 'folder' 
            ? `/api/folders/${contextMenu.item.id}?userId=${session?.userId}`
            : `/api/documents/${contextMenu.item.id}?userId=${session?.userId}`;

        await fetch(endpoint, { method: 'DELETE' });
        fetchContent();
        setSelectedItem(null);
        setContextMenu(null);
    };

    const handleRestore = async () => {
        if (!contextMenu) return;
        
        const endpoint = contextMenu.item.type === 'folder' 
            ? `/api/folders/${contextMenu.item.id}/restore`
            : `/api/documents/${contextMenu.item.id}/restore`;

        await fetch(endpoint, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session?.userId })
        });
        fetchContent();
        setContextMenu(null);
    };

    const handleRename = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!contextMenu || !renameValue) return;

        const endpoint = contextMenu.item.type === 'folder' 
            ? `/api/folders/${contextMenu.item.id}` 
            : `/api/documents/${contextMenu.item.id}`; 

        await fetch(endpoint, { 
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: renameValue, userId: session?.userId })
        });
        
        setShowRename(false);
        setRenameValue('');
        fetchContent();
    };

    const fetchPermissions = async (type: 'file'|'folder', id: number) => {
        setPermissionLoading(true);
        setSharingTarget({ type, id });
        try {
            const endpoint = type === 'folder' 
                ? `/api/folders/${id}/permissions` 
                : `/api/documents/${id}/permissions`;
            
            const res = await fetch(endpoint);
            const data = await res.json();
            if (data.ok) {
                setSharePermissions(data.shares.map((s: any) => ({ id: s.id, email: s.shared_with_email })));
                setPermissionOwner(data.owner || null);
            } else {
                setSharePermissions([]);
                setPermissionOwner(null);
            }
        } catch (e) { console.error(e); }
        setPermissionLoading(false);
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sharingTarget || !shareEmail) return;
        
        const endpoint = sharingTarget.type === 'folder'
            ? `/api/folders/${sharingTarget.id}/share`
            : `/api/documents/${sharingTarget.id}/share`;

        await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: shareEmail })
        });
        
        setShareEmail('');
        fetchPermissions(sharingTarget.type, sharingTarget.id);
    };

    const handleRemoveShare = async (email: string) => {
        if (!sharingTarget) return;

        const endpoint = sharingTarget.type === 'folder'
            ? `/api/folders/${sharingTarget.id}/share?email=${encodeURIComponent(email)}`
            : `/api/documents/${sharingTarget.id}/share?email=${encodeURIComponent(email)}`;

        await fetch(endpoint, { method: 'DELETE' });
        fetchPermissions(sharingTarget.type, sharingTarget.id);
    };

    const openShareModal = (type: 'file'|'folder', id: number) => {
        setShareEmail('');
        fetchPermissions(type, id);
        setShowShare(true);
    };

    const handleMove = async (targetFolderId: number | null) => {
        if (!draggedItem || draggedItem.type !== 'file') return;
        await fetch(`/api/documents/${draggedItem.id}/move`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folderId: targetFolderId, userId: session?.userId })
        });
        setDraggedItem(null);
        setDragOver(null);
        fetchContent();
    };

    const handleDownload = (id: number) => {
        window.open(`/api/documents/${id}/download`, '_blank');
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
    };

    const getSectionTitle = () => {
        if (viewSection === 'shared') return 'Shared with me';
        if (viewSection === 'trash') return 'Trash';
        return folderPath.length > 0 ? folderPath[folderPath.length - 1].name : 'My Drive';
    };

    if (sessionLoading) {
        return (
            <div className="admin-layout">
                <div className="admin-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar session={session} onLogout={logout} />
            
            <div className="drive-container">
                {/* Drive Sidebar */}
                <aside className="drive-sidebar">
                    <button className="upload-btn" onClick={() => setShowUpload(true)}>
                        <span className="upload-icon"><Icons.Plus /></span>
                        <span>New</span>
                    </button>
                    
                    <nav className="drive-nav">
                        <div 
                            className={`drive-nav-item ${viewSection === 'my-drive' ? 'active' : ''}`}
                            onClick={() => { setViewSection('my-drive'); setCurrentFolder(null); setFolderPath([]); setSelectedItem(null); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOver('root'); }}
                            onDragLeave={() => setDragOver(null)}
                            onDrop={(e) => { e.preventDefault(); handleMove(null); }}
                        >
                            <span className="nav-icon"><Icons.Drive /></span>
                            <span>My Drive</span>
                        </div>
                        <div 
                            className={`drive-nav-item ${viewSection === 'shared' ? 'active' : ''}`}
                            onClick={() => { setViewSection('shared'); setCurrentFolder(null); setFolderPath([]); setSelectedItem(null); }}
                        >
                            <span className="nav-icon"><Icons.Users /></span>
                            <span>Shared with me</span>
                        </div>
                        <div 
                            className={`drive-nav-item ${viewSection === 'trash' ? 'active' : ''}`}
                            onClick={() => { setViewSection('trash'); setCurrentFolder(null); setFolderPath([]); setSelectedItem(null); }}
                        >
                            <span className="nav-icon"><Icons.Trash /></span>
                            <span>Trash</span>
                        </div>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="drive-main">
                    {/* Header */}
                    <header className="drive-header">
                        <div className="search-box">
                            <span className="search-icon"><Icons.Search /></span>
                            <input 
                                type="text"
                                placeholder="Search in Drive" 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && fetchContent()}
                            />
                        </div>
                        <div className="header-actions">
                            <button 
                                className="icon-btn" 
                                onClick={() => setShowCreateFolder(true)} 
                                title="New Folder"
                            >
                                <Icons.FolderPlus />
                            </button>
                            <button 
                                className="icon-btn" 
                                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                                title={viewMode === 'grid' ? 'List view' : 'Grid view'}
                            >
                                {viewMode === 'grid' ? <Icons.List /> : <Icons.Grid />}
                            </button>
                        </div>
                    </header>

                    {/* Breadcrumbs */}
                    <div className="breadcrumbs">
                        <span 
                            className="crumb clickable"
                            onClick={() => { setCurrentFolder(null); setFolderPath([]); }}
                        >
                            {viewSection === 'shared' ? 'Shared with me' : viewSection === 'trash' ? 'Trash' : 'My Drive'}
                        </span>
                        {folderPath.map((folder, index) => (
                            <span key={folder.id} className="crumb-wrapper">
                                <span className="crumb-sep"><Icons.ChevronRight /></span>
                                <span 
                                    className="crumb clickable"
                                    onClick={() => {
                                        const newPath = folderPath.slice(0, index + 1);
                                        setFolderPath(newPath);
                                        setCurrentFolder(newPath[newPath.length - 1].id);
                                    }}
                                >
                                    {folder.name}
                                </span>
                            </span>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="drive-content">
                        {loading && <div className="loading-bar" />}

                        {viewSection === 'trash' && (
                            <div className="info-banner">
                                Items in trash will be deleted forever after 30 days
                            </div>
                        )}

                        {/* Folders Section */}
                        {folders.length > 0 && (
                            <section className="content-section">
                                <h3 className="section-title">Folders</h3>
                                <div className={`items-${viewMode}`}>
                                    {folders.map(folder => (
                                        <div 
                                            key={folder.id}
                                            className={`folder-card ${dragOver === folder.id ? 'drag-over' : ''}`}
                                            onClick={() => enterFolder(folder)}
                                            onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id, folder.name)}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(folder.id); }}
                                            onDragLeave={() => setDragOver(null)}
                                            onDrop={(e) => { e.preventDefault(); handleMove(folder.id); }}
                                        >
                                            <span className="folder-icon"><Icons.Folder /></span>
                                            <span className="folder-name">{folder.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Files Section */}
                        <section className="content-section">
                            {(folders.length > 0 || documents.length > 0) && (
                                <h3 className="section-title">Files</h3>
                            )}
                            
                            {documents.length === 0 && folders.length === 0 && !loading ? (
                                <div className="empty-state">
                                    <div className="empty-icon"><Icons.Folder /></div>
                                    <p>No files here</p>
                                    <span>Upload files or create folders to get started</span>
                                </div>
                            ) : (
                                <div className={`items-${viewMode}`}>
                                    {documents.map(doc => (
                                        <div 
                                            key={doc.id}
                                            className={`file-card ${viewMode} ${selectedItem?.data.id === doc.id && selectedItem?.type === 'file' ? 'selected' : ''}`}
                                            draggable
                                            onDragStart={() => setDraggedItem({ type: 'file', id: doc.id })}
                                            onDragEnd={() => { setDraggedItem(null); setDragOver(null); }}
                                            onClick={() => setSelectedItem({ type: 'file', data: doc })}
                                            onContextMenu={(e) => handleContextMenu(e, 'file', doc.id, doc.title)}
                                            onDoubleClick={() => handleDownload(doc.id)}
                                        >
                                            <div className="file-thumb">
                                                {doc.file_type?.includes('image') ? <Icons.Image /> : <Icons.File />}
                                            </div>
                                            <div className="file-info">
                                                <span className="file-name">{doc.title}</span>
                                                {viewMode === 'list' && (
                                                    <div className="file-meta">
                                                        <span>{formatSize(doc.file_size)}</span>
                                                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </main>

                {/* Details Panel */}
                {selectedItem && (
                    <aside className="details-panel">
                        <div className="details-header">
                            <h3>{(selectedItem.data as any).title || (selectedItem.data as any).name}</h3>
                            <button className="close-btn" onClick={() => setSelectedItem(null)}>
                                <Icons.X />
                            </button>
                        </div>
                        
                        <div className="details-preview">
                            <div className="preview-icon">
                                {selectedItem.type === 'folder' ? <Icons.Folder /> : 
                                 (selectedItem.data as Document).file_type?.includes('image') ? <Icons.Image /> : <Icons.File />}
                            </div>
                        </div>

                        <div className="details-meta">
                            <h4>Details</h4>
                            <div className="meta-row">
                                <span className="meta-label">Type</span>
                                <span className="meta-value">
                                    {selectedItem.type === 'folder' ? 'Folder' : (selectedItem.data as Document).file_type || 'File'}
                                </span>
                            </div>
                            {selectedItem.type === 'file' && (
                                <div className="meta-row">
                                    <span className="meta-label">Size</span>
                                    <span className="meta-value">{formatSize((selectedItem.data as Document).file_size)}</span>
                                </div>
                            )}
                            <div className="meta-row">
                                <span className="meta-label">Owner</span>
                                <span className="meta-value">{(selectedItem.data as any).role === 'owner' ? 'Me' : 'Shared'}</span>
                            </div>
                            {selectedItem.type === 'file' && (
                                <div className="meta-row">
                                    <span className="meta-label">Created</span>
                                    <span className="meta-value">
                                        {new Date((selectedItem.data as Document).created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="details-actions">
                            {selectedItem.type === 'file' && (
                                <button className="action-btn primary" onClick={() => handleDownload(selectedItem.data.id)}>
                                    <Icons.Download />
                                    Download
                                </button>
                            )}
                            <button className="action-btn" onClick={() => openShareModal(selectedItem.type, selectedItem.data.id)}>
                                <Icons.Share />
                                Share
                            </button>
                        </div>
                    </aside>
                )}
            </div>

            {/* Context Menu */}
            {contextMenu && (
                <div 
                    className="context-menu" 
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {contextMenu.item.type === 'file' && (
                        <button className="context-item" onClick={() => { handleDownload(contextMenu.item.id); setContextMenu(null); }}>
                            Download
                        </button>
                    )}
                    {viewSection !== 'trash' ? (
                        <>
                            <button className="context-item" onClick={() => { setRenameValue(contextMenu.item.name || ''); setShowRename(true); setContextMenu(null); }}>
                                Rename
                            </button>
                            <button className="context-item" onClick={() => { openShareModal(contextMenu.item.type, contextMenu.item.id); setContextMenu(null); }}>
                                Share
                            </button>
                            <div className="context-separator" />
                            <button className="context-item danger" onClick={() => { handleDelete(); setContextMenu(null); }}>
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="context-item" onClick={handleRestore}>Restore</button>
                            <div className="context-separator" />
                            <button className="context-item danger" onClick={() => { handleDelete(); setContextMenu(null); }}>
                                Delete forever
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setUploadStatus('idle'); setUploadFile(null); }} title="Upload File">
                {uploadStatus === 'idle' ? (
                    <form onSubmit={handleUpload}>
                        <div className="upload-zone">
                            <input 
                                type="file" 
                                id="file-input"
                                onChange={e => setUploadFile(e.target.files?.[0] || null)} 
                                required 
                            />
                            <label htmlFor="file-input" className="upload-label">
                                <Icons.Upload />
                                <span>{uploadFile ? uploadFile.name : 'Choose a file or drag it here'}</span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowUpload(false)}>
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={!uploadFile}>
                                Upload
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="upload-status">
                        {uploadStatus === 'uploading' && (
                            <>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <p>Uploading... {uploadProgress}%</p>
                            </>
                        )}
                        {uploadStatus === 'success' && <p className="success">✓ Upload complete</p>}
                        {uploadStatus === 'error' && <p className="error">Upload failed</p>}
                    </div>
                )}
            </Modal>

            <Modal isOpen={showCreateFolder} onClose={() => setShowCreateFolder(false)} title="New Folder">
                <form onSubmit={handleCreateFolder}>
                    <input 
                        autoFocus 
                        className="form-input" 
                        placeholder="Folder name" 
                        value={newFolderName} 
                        onChange={e => setNewFolderName(e.target.value)} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowCreateFolder(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={showRename} onClose={() => setShowRename(false)} title="Rename">
                <form onSubmit={handleRename}>
                    <input 
                        autoFocus 
                        className="form-input" 
                        value={renameValue} 
                        onChange={e => setRenameValue(e.target.value)} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowRename(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Rename</button>
                    </div>
                </form>
            </Modal>

            {/* Share Modal */}
            <Modal isOpen={showShare} onClose={() => setShowShare(false)} title="Share">
                <div className="share-content">
                    <form onSubmit={handleShare} className="share-form">
                        <input 
                            className="form-input" 
                            placeholder="Add people by email" 
                            value={shareEmail} 
                            onChange={e => setShareEmail(e.target.value)} 
                        />
                        <button type="submit" className="btn btn-primary">Invite</button>
                    </form>

                    <div className="share-section">
                        <h4>People with access</h4>
                        
                        {permissionLoading ? (
                            <div className="share-loading">Loading...</div>
                        ) : (
                            <div className="share-list">
                                <div className="share-user">
                                    <div className="user-avatar owner">
                                        {permissionOwner?.isMe ? 'Y' : (permissionOwner?.name?.[0] || 'O')}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{permissionOwner?.isMe ? 'You' : permissionOwner?.name}</span>
                                        <span className="user-role">Owner</span>
                                    </div>
                                </div>
                                
                                {sharePermissions.map(share => (
                                    <div key={share.id} className="share-user">
                                        <div className="user-avatar">
                                            {share.email[0].toUpperCase()}
                                        </div>
                                        <div className="user-details">
                                            <span className="user-name">{share.email}</span>
                                            <span className="user-role">Viewer</span>
                                        </div>
                                        <button 
                                            className="remove-btn" 
                                            onClick={() => handleRemoveShare(share.email)}
                                        >
                                            <Icons.X />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="share-footer">
                        <button className="btn btn-primary" onClick={() => setShowShare(false)}>Done</button>
                    </div>
                </div>
            </Modal>

            <style jsx>{`
                .drive-container {
                    display: flex;
                    flex: 1;
                    height: 100vh;
                    overflow: hidden;
                    background: var(--bg-secondary);
                }

                /* Drive Sidebar */
                .drive-sidebar {
                    width: 220px;
                    padding: 16px;
                    border-right: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    flex-shrink: 0;
                }

                .upload-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 20px;
                    background: var(--accent-blue);
                    border: none;
                    border-radius: 24px;
                    color: white;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
                }

                .upload-btn:hover {
                    background: #2563eb;
                    transform: translateY(-1px);
                }

                .upload-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                }

                .upload-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .drive-nav {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .drive-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 12px;
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .drive-nav-item:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .drive-nav-item.active {
                    background: rgba(59, 130, 246, 0.1);
                    color: #60a5fa;
                }

                .nav-icon {
                    width: 20px;
                    height: 20px;
                    display: flex;
                }

                .nav-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                /* Main Area */
                .drive-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                /* Header */
                .drive-header {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 16px 24px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .search-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    flex: 1;
                    max-width: 600px;
                    padding: 10px 16px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    transition: all 0.2s;
                }

                .search-box:focus-within {
                    border-color: var(--accent-blue);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }

                .search-icon {
                    width: 18px;
                    height: 18px;
                    color: var(--text-muted);
                    display: flex;
                }

                .search-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .search-box input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    color: var(--text-primary);
                    font-size: 14px;
                    outline: none;
                }

                .search-box input::placeholder {
                    color: var(--text-muted);
                }

                .header-actions {
                    display: flex;
                    gap: 8px;
                }

                .icon-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .icon-btn:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                    color: var(--text-primary);
                }

                .icon-btn :global(svg) {
                    width: 18px;
                    height: 18px;
                }

                /* Breadcrumbs */
                .breadcrumbs {
                    display: flex;
                    align-items: center;
                    padding: 12px 24px;
                    font-size: 14px;
                    color: var(--text-secondary);
                    border-bottom: 1px solid var(--border-subtle);
                }

                .crumb {
                    color: var(--text-primary);
                    font-weight: 500;
                }

                .crumb.clickable {
                    cursor: pointer;
                }

                .crumb.clickable:hover {
                    color: var(--accent-blue);
                }

                .crumb-wrapper {
                    display: flex;
                    align-items: center;
                }

                .crumb-sep {
                    width: 16px;
                    height: 16px;
                    color: var(--text-muted);
                    margin: 0 4px;
                    display: flex;
                }

                .crumb-sep :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                /* Content */
                .drive-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 24px;
                    position: relative;
                }

                .loading-bar {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, var(--accent-blue), transparent);
                    animation: loading 1.5s infinite;
                }

                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .info-banner {
                    background: rgba(59, 130, 246, 0.08);
                    border: 1px solid rgba(59, 130, 246, 0.15);
                    color: #60a5fa;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-bottom: 24px;
                    text-align: center;
                }

                .content-section {
                    margin-bottom: 32px;
                }

                .section-title {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                }

                /* Grid View */
                .items-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap: 12px;
                }

                /* List View */
                .items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                /* Folder Card */
                .folder-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .folder-card:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                }

                .folder-card.drag-over {
                    border-color: var(--accent-blue);
                    background: rgba(59, 130, 246, 0.05);
                }

                .folder-icon {
                    width: 24px;
                    height: 24px;
                    color: #60a5fa;
                    display: flex;
                }

                .folder-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .folder-name {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* File Card - Grid */
                .file-card.grid {
                    display: flex;
                    flex-direction: column;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .file-card.grid:hover {
                    border-color: var(--border-hover);
                }

                .file-card.grid.selected {
                    border-color: var(--accent-blue);
                    box-shadow: 0 0 0 1px var(--accent-blue);
                }

                .file-card.grid .file-thumb {
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-primary);
                    color: var(--text-muted);
                }

                .file-card.grid .file-thumb :global(svg) {
                    width: 48px;
                    height: 48px;
                    opacity: 0.5;
                }

                .file-card.grid .file-info {
                    padding: 12px;
                }

                .file-card.grid .file-name {
                    font-size: 13px;
                    font-weight: 500;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                /* File Card - List */
                .file-card.list {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 10px 16px;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: background 0.1s;
                }

                .file-card.list:hover {
                    background: var(--bg-hover);
                }

                .file-card.list.selected {
                    background: rgba(59, 130, 246, 0.08);
                }

                .file-card.list .file-thumb {
                    width: 24px;
                    height: 24px;
                    color: var(--text-muted);
                    display: flex;
                    flex-shrink: 0;
                }

                .file-card.list .file-thumb :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .file-card.list .file-info {
                    display: flex;
                    align-items: center;
                    flex: 1;
                    gap: 16px;
                    min-width: 0;
                }

                .file-card.list .file-name {
                    flex: 1;
                    font-size: 14px;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .file-card.list .file-meta {
                    display: flex;
                    gap: 24px;
                    font-size: 13px;
                    color: var(--text-muted);
                    flex-shrink: 0;
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    text-align: center;
                }

                .empty-icon {
                    width: 64px;
                    height: 64px;
                    color: var(--text-dim);
                    margin-bottom: 16px;
                    opacity: 0.4;
                }

                .empty-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .empty-state p {
                    font-size: 16px;
                    font-weight: 500;
                    color: var(--text-secondary);
                    margin-bottom: 4px;
                }

                .empty-state span {
                    font-size: 14px;
                    color: var(--text-muted);
                }

                /* Details Panel */
                .details-panel {
                    width: 300px;
                    background: var(--bg-primary);
                    border-left: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    flex-shrink: 0;
                }

                .details-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 20px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .details-header h3 {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--text-primary);
                    line-height: 1.4;
                    word-break: break-word;
                    flex: 1;
                    margin-right: 12px;
                }

                .close-btn {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text-muted);
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .close-btn:hover {
                    background: var(--bg-hover);
                    color: var(--text-primary);
                }

                .close-btn :global(svg) {
                    width: 16px;
                    height: 16px;
                }

                .details-preview {
                    padding: 32px;
                    display: flex;
                    justify-content: center;
                }

                .preview-icon {
                    width: 80px;
                    height: 80px;
                    color: var(--text-muted);
                    opacity: 0.6;
                }

                .preview-icon :global(svg) {
                    width: 100%;
                    height: 100%;
                }

                .details-meta {
                    padding: 0 20px 20px;
                    flex: 1;
                }

                .details-meta h4 {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid var(--border-subtle);
                }

                .meta-row {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    margin-bottom: 16px;
                }

                .meta-label {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .meta-value {
                    font-size: 14px;
                    color: var(--text-primary);
                }

                .details-actions {
                    padding: 20px;
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .action-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-subtle);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }

                .action-btn:hover {
                    background: var(--bg-hover);
                    border-color: var(--border-hover);
                    color: var(--text-primary);
                }

                .action-btn.primary {
                    background: var(--accent-blue);
                    border-color: var(--accent-blue);
                    color: white;
                }

                .action-btn.primary:hover {
                    background: #2563eb;
                }

                .action-btn :global(svg) {
                    width: 16px;
                    height: 16px;
                }

                /* Context Menu */
                .context-menu {
                    position: fixed;
                    background: var(--bg-elevated);
                    border: 1px solid var(--border-default);
                    border-radius: 8px;
                    padding: 4px;
                    min-width: 160px;
                    box-shadow: var(--shadow-lg);
                    z-index: 1000;
                }

                .context-item {
                    display: block;
                    width: 100%;
                    padding: 8px 12px;
                    background: transparent;
                    border: none;
                    border-radius: 4px;
                    color: var(--text-secondary);
                    font-size: 13px;
                    text-align: left;
                    cursor: pointer;
                    transition: all 0.1s;
                }

                .context-item:hover {
                    background: var(--accent-blue);
                    color: white;
                }

                .context-item.danger {
                    color: var(--accent-red);
                }

                .context-item.danger:hover {
                    background: var(--accent-red);
                    color: white;
                }

                .context-separator {
                    height: 1px;
                    background: var(--border-subtle);
                    margin: 4px 0;
                }

                /* Upload Zone */
                .upload-zone {
                    position: relative;
                }

                .upload-zone input {
                    position: absolute;
                    opacity: 0;
                    width: 100%;
                    height: 100%;
                    cursor: pointer;
                }

                .upload-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    padding: 40px 20px;
                    border: 2px dashed var(--border-default);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .upload-label:hover {
                    border-color: var(--accent-blue);
                    background: rgba(59, 130, 246, 0.05);
                }

                .upload-label :global(svg) {
                    width: 32px;
                    height: 32px;
                    color: var(--text-muted);
                }

                .upload-label span {
                    font-size: 14px;
                    color: var(--text-secondary);
                }

                .upload-status {
                    text-align: center;
                    padding: 20px;
                }

                .progress-bar {
                    height: 4px;
                    background: var(--bg-primary);
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 12px;
                }

                .progress-fill {
                    height: 100%;
                    background: var(--accent-blue);
                    transition: width 0.3s;
                }

                .upload-status .success {
                    color: var(--accent-green);
                }

                .upload-status .error {
                    color: var(--accent-red);
                }

                /* Share Modal */
                .share-content {
                    min-height: 300px;
                    display: flex;
                    flex-direction: column;
                }

                .share-form {
                    display: flex;
                    gap: 8px;
                    margin-bottom: 24px;
                }

                .share-form input {
                    flex: 1;
                }

                .share-section {
                    flex: 1;
                }

                .share-section h4 {
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }

                .share-loading {
                    text-align: center;
                    padding: 20px;
                    color: var(--text-muted);
                }

                .share-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .share-user {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px;
                    border-radius: 8px;
                }

                .share-user:hover {
                    background: var(--bg-hover);
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--bg-elevated);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--text-primary);
                    flex-shrink: 0;
                }

                .user-avatar.owner {
                    background: var(--accent-blue);
                    color: white;
                }

                .user-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    min-width: 0;
                }

                .user-name {
                    font-size: 14px;
                    color: var(--text-primary);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .user-role {
                    font-size: 12px;
                    color: var(--text-muted);
                }

                .remove-btn {
                    width: 28px;
                    height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 6px;
                    color: var(--text-muted);
                    cursor: pointer;
                }

                .remove-btn:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--accent-red);
                }

                .remove-btn :global(svg) {
                    width: 14px;
                    height: 14px;
                }

                .share-footer {
                    padding-top: 16px;
                    border-top: 1px solid var(--border-subtle);
                    display: flex;
                    justify-content: flex-end;
                    margin-top: auto;
                }
            `}</style>
        </div>
    );
}
