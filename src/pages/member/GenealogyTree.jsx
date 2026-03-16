import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

function TreeNode({ node, onNavigate, onRegister }) {
  if (!node) return null;

  const typeColors = {
    Bronze: 'border-amber-400 bg-amber-50', Silver: 'border-gray-400 bg-gray-50',
    Gold: 'border-yellow-500 bg-yellow-50', Platinum: 'border-slate-500 bg-slate-50',
    Garnet: 'border-red-500 bg-red-50', Diamond: 'border-blue-500 bg-blue-50',
  };

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <div className={`border-2 rounded-xl p-3 min-w-[140px] text-center cursor-pointer hover:shadow-md transition-shadow ${typeColors[node.accttypeName] || 'border-gray-300 bg-white'}`}
           onClick={() => onNavigate(node.uid)}>
        <p className="font-semibold text-sm text-gray-800">{node.username}</p>
        <p className="text-xs text-gray-500">{node.fullname}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white/50 text-gray-600">{node.accttypeName}</span>
      </div>

      {/* Children */}
      <div className="flex gap-4 mt-4 pt-4 relative">
        {/* Left connector line */}
        {(node.left || node.hasLeftSlot) && <div className="absolute top-0 left-1/4 w-0.5 h-4 bg-gray-300"></div>}
        {(node.right || node.hasRightSlot) && <div className="absolute top-0 right-1/4 w-0.5 h-4 bg-gray-300"></div>}
        {(node.left || node.hasLeftSlot) && (node.right || node.hasRightSlot) && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-gray-300"></div>}
        <div className="absolute top-0 left-1/2 -translate-x-0.5 w-0.5 h-0 bg-gray-300"></div>

        {/* Left child */}
        <div className="flex flex-col items-center min-w-[140px]">
          {node.left ? (
            <TreeNode node={node.left} onNavigate={onNavigate} onRegister={onRegister} />
          ) : node.hasLeftSlot ? (
            <button onClick={() => onRegister(node.uid, 1)} className="border-2 border-dashed border-emerald-400 rounded-xl p-3 min-w-[140px] text-center hover:bg-emerald-50 transition-colors">
              <p className="text-emerald-600 font-medium text-sm">+ Register</p>
              <p className="text-xs text-gray-400">Left Position</p>
            </button>
          ) : null}
        </div>

        {/* Right child */}
        <div className="flex flex-col items-center min-w-[140px]">
          {node.right ? (
            <TreeNode node={node.right} onNavigate={onNavigate} onRegister={onRegister} />
          ) : node.hasRightSlot ? (
            <button onClick={() => onRegister(node.uid, 2)} className="border-2 border-dashed border-emerald-400 rounded-xl p-3 min-w-[140px] text-center hover:bg-emerald-50 transition-colors">
              <p className="text-emerald-600 font-medium text-sm">+ Register</p>
              <p className="text-xs text-gray-400">Right Position</p>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function GenealogyTree() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState(null);
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

  function handleNavigate(uid) {
    setSearchParams({ id: uid });
  }

  function handleRegister(placementUid, position) {
    window.location.href = `/register?placement=${placementUid}&position=${position}`;
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Genealogy Tree</h1>
        {String(rootId) !== String(user?.uid) && (
          <button onClick={() => setSearchParams({})} className="btn-secondary text-sm">Back to My Tree</button>
        )}
      </div>
      <div className="card overflow-x-auto">
        <div className="min-w-[600px] flex justify-center py-6">
          {tree ? <TreeNode node={tree} onNavigate={handleNavigate} onRegister={handleRegister} /> : <p className="text-gray-400">No genealogy data.</p>}
        </div>
      </div>
    </div>
  );
}
