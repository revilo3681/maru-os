import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F1E8] text-[#2C3E50] p-6">
          <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-t-4 border-[#B8924A]">
            <h2 className="text-2xl font-serif font-bold text-[#1E3A5F] mb-4">Algo salió mal</h2>
            <p className="text-[#6B7F8C] mb-6">
              Ha ocurrido un error inesperado al renderizar esta vista.
            </p>
            <div className="bg-red-50 text-red-700 p-4 rounded-lg text-left text-xs font-mono overflow-auto max-h-32 mb-6">
              {this.state.errorMsg}
            </div>
            <button
              className="px-6 py-2 bg-[#1E3A5F] hover:bg-[#2C3E50] text-white rounded-xl transition-all"
              onClick={() => window.location.reload()}
            >
              Recargar MARU OS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
