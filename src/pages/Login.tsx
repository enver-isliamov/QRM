import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, CheckCircle, Chrome } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, signInWithMagicLink, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/profile', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setError(error.message); setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/')} className="text-gray-600 flex items-center gap-1">
          <span>←</span><span>{t('auth.back_home')}</span>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl text-white font-bold">О</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">{t('auth.title')}</h1>
            <p className="text-gray-500 mt-1">{t('auth.subtitle')}</p>
          </div>

          {sent ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">{t('auth.email_sent_title')}</h2>
              <p className="text-gray-600 mb-4" dangerouslySetInnerHTML={{ __html: t('auth.email_sent_desc', { email }) }} />
              <button onClick={() => setSent(false)} className="text-emerald-600 text-sm hover:underline">
                {t('auth.change_email')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Google */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-60">
                <Chrome className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-800">{t('auth.google_button')}</span>
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">{t('auth.or_email')}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Magic Link */}
              <form onSubmit={handleMagicLink} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.email_label')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('auth.email_placeholder')}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading || !email}
                  className="w-full bg-emerald-500 text-white rounded-xl py-3 font-medium hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  {loading ? t('auth.sending') : t('auth.magic_link_button')}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  {t('auth.magic_link_desc')}
                </p>
              </form>
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              {t('auth.terms_text')}{' '}
              <a href="#" className="text-emerald-600 hover:underline">{t('auth.terms_link')}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
