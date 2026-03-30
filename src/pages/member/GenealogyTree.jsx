import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineHome } from 'react-icons/hi';

/* Package colors → gold-tinted dark palette */
const TYPE_STYLES = {
  Bronze:   { border: '#CD7F32', bg: 'rgba(205,127,50,0.1)',  text: '#CD7F32' },
  Silver:   { border: '#C0C0C0', bg: 'rgba(192,192,192,0.1)', text: '#C0C0C0' },
  Gold:     { border: '#FFD700', bg: 'rgba(255,215,0,0.12)',  text: '#FFD700' },
  Platinum: { border: '#D4D4D4', bg: 'rgba(212,212,212,0.1)', text: '#D4D4D4' },
  Garnet:   { border: '#9B4444', bg: 'rgba(155,68,68,0.15)',  text: '#C86464' },
  Diamond:  { border: '#B9F2FF', bg: 'rgba(185,242,255,0.1)', text: '#B9F2FF' },
};

function ConnectorLines({ hasLeft, hasRight }) {
  if (!hasLeft && !hasRight) return null;
  return (
    <div className="relative h-6 w-full flex items-start justify-center">
      {/* Vertical stem */}
      <div className="absolute top-0 left-1/2 -translate-x-0.5 w-px h-full" style={{ background: 'rgba(212,175,55,0.25)' }} />
      {/* Horizontal bar */}
      {hasLeft && hasRight && (
        <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: 'rgba(212,175,55,0.25)' }} />
      )}
    </div>
  );
}

function TreeNode({ node, onNavigate, onRegister }) {
  if (!node) return null;

  const style = TYPE_STYLES[node.accttypeName] || { border: 'rgba(212,175,55,0.3)', bg: 'rgba(212,175,55,0.06)', text: '#D4AF37' };
  const hasLeft  = !!(node.left  || node.hasLeftSlot);
  const hasRight = !!(node.right || node.hasRightSlot);

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        onClick={() => onNavigate(node.uid)}
        className="relative group rounded-xl px-4 py-3 min-w-[144px] text-center cursor-pointer transition-all duration-200"
        style={{
          background: style.bg,
          border: `1.5px solid ${style.border}40`,
          boxShadow: `0 4px 16px rgba(0,0,0,0.3)`,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${style.border}90`;
          e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.4), 0 0 16px ${style.border}20`;
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = `${style.border}40`;
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <p className="font-semibold text-sm text-white leading-tight">{node.username}</p>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{node.fullname}</p>
        <span
          className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `${style.border}18`, color: style.text, border: `1px solid ${style.border}30` }}
        >
          {node.accttypeName}
        </span>
      </div>

      {/* Connectors */}
      {(hasLeft || hasRight) && (
        <>
          <ConnectorLines hasLeft={hasLeft} hasRight={hasRight} />
          <div className="flex gap-6 mt-0 relative">
            {/* Left subtree */}
            <div className="flex flex-col items-center min-w-[148px]">
              {/* Vertical drop from horizontal bar */}
              <div className="w-px h-5" style={{ background: 'rgba(212,175,55,0.22)' }} />
              {node.left ? (
                <TreeNode node={node.left} onNavigate={onNavigate} onRegister={onRegister} />
              ) : node.hasLeftSlot ? (
                <button
                  onClick={() => onRegister(node.uid, 1)}
                  className="rounded-xl px-4 py-3 min-w-[144px] text-center transition-all duration-200"
                  style={{
                    background: 'rgba(34,197,94,0.05)',
                    border: '1.5px dashed rgba(34,197,94,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>+ Register</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Left Position</p>
                </button>
              ) : null}
            </div>

            {/* Right subtree */}
            <div className="flex flex-col items-center min-w-[148px]">
              <div className="w-px h-5" style={{ background: 'rgba(212,175,55,0.22)' }} />
              {node.right ? (
                <TreeNode node={node.right} onNavigate={onNavigate} onRegister={onRegister} />
              ) : node.hasRightSlot ? (
                <button
                  onClick={() => onRegister(node.uid, 2)}
                  className="rounded-xl px-4 py-3 min-w-[144px] text-center transition-all duration-200"
                  style={{
                    background: 'rgba(34,197,94,0.05)',
                    border: '1.5px dashed rgba(34,197,94,0.3)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.08)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.5)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.05)'; e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'; }}
                >
                  <p className="text-sm font-semibold" style={{ color: '#4ade80' }}>+ Register</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Right Position</p>
                </button>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function GenealogyTree() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree]     = useState(null);
  const [loading, setLoading] = useState(true);

  const rootId = searchParams.get('id') || user?.uid;

  useEffect(() => { loadTree(); }, [rootId]);

  async function loadTree() {
    setLoading(true);
    try {
      const res = await api.get(`/genealogy/tree?id=${rootId}`);
      setTree(res.data.tree);
    } catch { } finally { setLoading(false); }
  }

  function handleNavigate(uid)  { setSearchParams({ id: uid }); }
  function handleRegister(placementUid, position) {
    window.location.href = `/portal/register?placement=${placementUid}&position=${position}`;
    // Note: basename is /portal, so the path maps correctly via React Router
  }

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Genealogy Tree</h1>
          <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
        </div>
        {String(rootId) !== String(user?.uid) && (
          <button
            onClick={() => setSearchParams({})}
            className="flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-xl gold-btn-outline"
          >
            <HiOutlineHome className="w-4 h-4" />
            My Tree
          </button>
        )}
      </div>

      {/* Tree card */}
      <div className="glass-card rounded-2xl overflow-x-auto p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] animate-spin" style={{ borderColor: 'rgba(212,175,55,0.12)', borderTopColor: '#D4AF37' }} />
          </div>
        ) : (
          <div className="min-w-[500px] flex justify-center py-4">
            {tree
              ? <TreeNode node={tree} onNavigate={handleNavigate} onRegister={handleRegister} />
              : <p style={{ color: 'rgba(255,255,255,0.3)' }}>No genealogy data found.</p>
            }
          </div>
        )}
      </div>
    </div>
  );
}
