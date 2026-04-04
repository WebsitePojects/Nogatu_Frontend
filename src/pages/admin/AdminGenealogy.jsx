import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

const TYPE_STYLES = {
  Bronze:   { border: '#CD7F32', bg: 'rgba(205,127,50,0.10)', text: '#CD7F32' },
  Silver:   { border: '#A8A9AD', bg: 'rgba(168,169,173,0.10)', text: '#A8A9AD' },
  Gold:     { border: '#DAA520', bg: 'rgba(218,165,32,0.12)', text: '#DAA520' },
  Platinum: { border: '#6C757D', bg: 'rgba(108,117,125,0.10)', text: '#6C757D' },
  Garnet:   { border: '#9B2335', bg: 'rgba(155,35,53,0.14)', text: '#9B2335' },
  Diamond:  { border: '#4FC3F7', bg: 'rgba(79,195,247,0.10)', text: '#4FC3F7' },
};

function ConnectorLines({ hasLeft, hasRight }) {
  if (!hasLeft && !hasRight) return null;
  return (
    <div className="relative w-full" style={{ height: '36px' }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 36" preserveAspectRatio="none">
        <line x1="100" y1="0" x2="100" y2="18" stroke="rgba(212,175,55,0.22)" strokeWidth="1.5" />
        {hasLeft && hasRight ? (
          <>
            <line x1="50" y1="18" x2="150" y2="18" stroke="rgba(212,175,55,0.22)" strokeWidth="1.5" />
            <line x1="50" y1="18" x2="50" y2="36" stroke="rgba(212,175,55,0.22)" strokeWidth="1.5" />
            <line x1="150" y1="18" x2="150" y2="36" stroke="rgba(212,175,55,0.22)" strokeWidth="1.5" />
          </>
        ) : (
          <line x1="100" y1="18" x2="100" y2="36" stroke="rgba(212,175,55,0.22)" strokeWidth="1.5" />
        )}
      </svg>
    </div>
  );
}

function TreeNode({ node, onNavigate }) {
  if (!node) return null;

  const style = TYPE_STYLES[node.accttypeName] || { border: '#D4AF37', bg: 'rgba(212,175,55,0.07)', text: '#D4AF37' };
  const emptySlotStyle = {
    border: `2px dashed ${style.border}40`,
    borderRadius: '0.75rem',
    padding: '0.75rem',
    minWidth: '140px',
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    fontSize: '0.75rem',
  };

  return (
    <div className="flex flex-col items-center">
      <div
        className="rounded-xl p-3 min-w-[140px] text-center cursor-pointer motion-safe:transition-all"
        style={{
          background: style.bg,
          border: `1.5px solid ${style.border}40`,
          backdropFilter: 'blur(12px)',
        }}
        onClick={() => onNavigate(node.uid)}
        onMouseEnter={e => {
          e.currentTarget.style.background = style.bg;
          e.currentTarget.style.boxShadow = `0 4px 20px ${style.border}22`;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = style.bg;
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <p className="font-semibold text-sm text-white/85">{node.username}</p>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{node.fullname}</p>
        <span
          className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${style.border}18`, color: style.text, border: `1px solid ${style.border}30` }}
        >
          {node.accttypeName}
        </span>
      </div>

      <ConnectorLines hasLeft={!!node.left || !!node.hasLeftSlot} hasRight={!!node.right || !!node.hasRightSlot} />
      <div className="flex gap-4 mt-0 relative">
        <div className="flex flex-col items-center min-w-[140px]">
          {node.left
            ? <TreeNode node={node.left} onNavigate={onNavigate} />
            : node.hasLeftSlot
              ? <div style={emptySlotStyle}>Left (Empty)</div>
              : null}
        </div>
        <div className="flex flex-col items-center min-w-[140px]">
          {node.right
            ? <TreeNode node={node.right} onNavigate={onNavigate} />
            : node.hasRightSlot
              ? <div style={emptySlotStyle}>Right (Empty)</div>
              : null}
        </div>
      </div>
    </div>
  );
}

export default function AdminGenealogy() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchUsername, setSearchUsername] = useState('');
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const rootId = searchParams.get('id');

  async function loadTree(id, username) {
    setLoading(true);
    try {
      let url = '/admin/genealogy?';
      if (id) url += `id=${id}`;
      else if (username) url += `username=${username}`;
      const res = await api.get(url);
      setTree(res.data.tree);
      if (res.data.rootUid) setSearchParams({ id: res.data.rootUid });
    } catch { toast.error('Account not found'); } finally { setLoading(false); }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (searchUsername) loadTree(null, searchUsername);
  }

  useEffect(() => {
    if (rootId) loadTree(rootId);
  }, [rootId]);

  return (
    <div>
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-white">Account Genealogy</h1>
        <div className="w-12 h-0.5 mt-2" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
      </div>

      {/* Search */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            value={searchUsername}
            onChange={(e) => setSearchUsername(e.target.value)}
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            placeholder="Enter username to view tree"
          />
          <button type="submit" className="gold-btn rounded-xl py-2.5 px-5 text-sm">
            View Tree
          </button>
        </form>
      </div>

      {/* Tree Display */}
      <div className="glass-card rounded-2xl p-6 overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="animate-spin rounded-full h-8 w-8 border-4"
              style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: 'rgba(212,175,55,0.75)' }}
            />
          </div>
        ) : tree ? (
          <div className="min-w-[600px] flex justify-center py-6">
            <TreeNode
              node={tree}
              onNavigate={(uid) => { setSearchParams({ id: uid }); loadTree(uid); }}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center py-14" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'rgba(212,175,55,0.3)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-sm">Search for an account to view its genealogy tree.</p>
          </div>
        )}
      </div>
    </div>
  );
}
