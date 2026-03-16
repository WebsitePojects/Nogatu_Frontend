import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Registration() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    activationCode: '',
    username: '',
    password: '',
    firstname: '',
    lastname: '',
    middlename: '',
    position: searchParams.get('position') || '1',
    placementUid: searchParams.get('placement') || '',
  });
  const [codeValid, setCodeValid] = useState(null);
  const [usernameValid, setUsernameValid] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Validate activation code on blur
  async function validateCode() {
    if (!form.activationCode) return;
    try {
      const res = await api.get(`/registration/validate-code?code=${form.activationCode}`);
      setCodeValid(res.data.valid);
      if (!res.data.valid) toast.error('Invalid or unavailable activation code');
    } catch { setCodeValid(false); }
  }

  // Validate username on blur
  async function validateUsername() {
    if (!form.username) return;
    try {
      const res = await api.get(`/registration/validate-username?username=${form.username}`);
      setUsernameValid(!res.data.exists);
      if (res.data.exists) toast.error('Username already taken');
    } catch { setUsernameValid(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (codeValid === false) return toast.error('Invalid activation code');
    if (usernameValid === false) return toast.error('Username already taken');
    setSubmitting(true);
    try {
      const res = await api.post('/registration/register', form);
      toast.success('Account registered successfully!');
      navigate(`/genealogy?id=${form.placementUid}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setSubmitting(false); }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Register New Account</h1>
      <div className="card max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Activation Code</label>
            <input type="text" value={form.activationCode} onChange={(e) => handleChange('activationCode', e.target.value)} onBlur={validateCode} className={`input-field ${codeValid === true ? 'border-emerald-500' : codeValid === false ? 'border-red-500' : ''}`} placeholder="Enter activation code" required />
          </div>

          <div>
            <label className="label">Sponsor</label>
            <input type="text" value={user?.username || ''} className="input-field bg-gray-50" disabled />
          </div>

          <div>
            <label className="label">Placement UID</label>
            <input type="text" value={form.placementUid} onChange={(e) => handleChange('placementUid', e.target.value)} className="input-field" placeholder="Placement account UID" required />
          </div>

          <div>
            <label className="label">Position</label>
            <select value={form.position} onChange={(e) => handleChange('position', e.target.value)} className="input-field">
              <option value="1">Left (Position A)</option>
              <option value="2">Right (Position B)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">First Name</label>
              <input type="text" value={form.firstname} onChange={(e) => handleChange('firstname', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input type="text" value={form.lastname} onChange={(e) => handleChange('lastname', e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="label">Middle Name</label>
              <input type="text" value={form.middlename} onChange={(e) => handleChange('middlename', e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label">Username</label>
            <input type="text" value={form.username} onChange={(e) => handleChange('username', e.target.value)} onBlur={validateUsername} className={`input-field ${usernameValid === true ? 'border-emerald-500' : usernameValid === false ? 'border-red-500' : ''}`} required />
          </div>

          <div>
            <label className="label">Password</label>
            <input type="text" value={form.password} onChange={(e) => handleChange('password', e.target.value)} className="input-field" required />
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
            {submitting ? 'Registering...' : 'Register Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
