import { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-rose-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Что-то пошло не так</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Произошла непредвиденная ошибка. Мы уже знаем о ней и работаем над исправлением.
            </p>
            <div className="bg-gray-50 rounded-xl p-3 mb-6 text-left overflow-auto max-h-32">
              <code className="text-xs text-rose-600 break-words">
                {this.state.error?.message || 'Неизвестная ошибка'}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-500 text-white rounded-xl py-3 font-medium flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Перезагрузить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
