import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase processes the hash/token automatically
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/profile', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Выполняем вход...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
