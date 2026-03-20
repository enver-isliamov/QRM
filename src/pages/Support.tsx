import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ExternalLink, Copy, Check, MessageCircle, Mail } from 'lucide-react';

function Support() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  const supportLink = 'https://pay.cloudtips.ru/p/8a27e9ab';
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(supportLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleOpenLink = () => {
    window.open(supportLink, '_blank');
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button 
          onClick={() => navigate(-1)}
          className="text-gray-600 mb-2"
        >
          ← Назад
        </button>
        <h1 className="text-xl font-bold text-gray-800">Поддержка проекта</h1>
      </div>
      
      {/* Support Content */}
      <div className="p-4 pb-20">
        {/* Hero Card */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white text-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Поддержите ORAZA</h2>
          <p className="text-emerald-100">
            Ваше пожертвование поможет развивать приложение и сохранять крымскотатарскую культуру
          </p>
        </div>
        
        {/* Support Link Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Ссылка для поддержки</h3>
          
          <div className="flex items-center gap-2 mb-4">
            <input 
              type="text" 
              value={supportLink}
              readOnly
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
            />
            <button
              onClick={handleCopyLink}
              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Копировать ссылку"
            >
              {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
            </button>
          </div>
          
          <button
            onClick={handleOpenLink}
            className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            <Heart className="w-5 h-5" />
            <span>Перейти к оплате</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        
        {/* Info Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Куда пойдут средства?</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span>Разработка и улучшение приложения</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span>Серверные расходы и хостинг</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span>Создание нового контента</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0" />
                <span>Поддержка крымскотатарской культуры</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">Другие способы поддержки</h3>
            <div className="space-y-3">
              <a 
                href="#" 
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Telegram канал</p>
                  <p className="text-sm text-gray-500">Подпишитесь и расскажите друзьям</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
              
              <a 
                href="mailto:support@oraza.ru" 
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Написать нам</p>
                  <p className="text-sm text-gray-500">support@oraza.ru</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
        
        {/* Thank You */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Спасибо за вашу поддержку! 🙏
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Сесинъизге рахмет! 🙏
          </p>
        </div>
      </div>
    </div>
  );
}

export default Support;
