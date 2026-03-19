import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

function TreeNode({ node, onNavigate }) {
  if (!node) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="border-2 border-gray-300 rounded-xl p-3 min-w-[140px] text-center cursor-pointer hover:shadow-md hover:border-primary-400 transition-all bg-white" onClick={() => onNavigate(node.uid)}>
        <p className="font-semibold text-sm text-gray-800">{node.username}</p>
        <p className="text-xs text-gray-500">{node.fullname}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{node.accttypeName}</span>
      </div>
      <div className="flex gap-4 mt-4 pt-4">
        <div className="flex flex-col items-center min-w-[140px]">
          {node.left ? <TreeNode node={node.left} onNavigate={onNavigate} /> : node.hasLeftSlot ? <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 min-w-[140px] text-center text-gray-400 text-xs">Left (Empty)</div> : null}
        </div>
        <div className="flex flex-col items-center min-w-[140px]">
          {node.right ? <TreeNode node={node.right} onNavigate={onNavigate} /> : node.hasRightSlot ? <div className="border-2 border-dashed border-gray-300 rounded-xl p-3 min-w-[140px] text-center text-gray-400 text-xs">Right (Empty)</div> : null}
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

  // Auto-load if id param exists
  useState(() => { if (rootId) loadTree(rootId); }, [rootId]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Account Genealogy</h1>
      <div className="card mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <input type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)} className="input-field flex-1" placeholder="Enter username to view tree" />
          <button type="submit" className="btn-primary">View Tree</button>
        </form>
      </div>
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : tree ? (
          <div className="min-w-[600px] flex justify-center py-6">
            <TreeNode node={tree} onNavigate={(uid) => { setSearchParams({ id: uid }); loadTree(uid); }} />
          </div>
        ) : (
          <p className="text-center py-8 text-gray-400">Search for an account to view its genealogy tree.</p>
        )}
      </div>
    </div>
  );
}
