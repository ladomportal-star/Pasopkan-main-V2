import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SafeBoundary extends React.Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside React Tree:', error, errorInfo);
    
    // Check if error is due to stale dynamic import chunk
    const isChunkLoadFailed = 
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkLoadFailed) {
      const isRetried = sessionStorage.getItem('eb_chunk_retry') === 'true';
      if (!isRetried) {
        sessionStorage.setItem('eb_chunk_retry', 'true');
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      let isSandboxIframe = false;
      try {
        isSandboxIframe = typeof window !== 'undefined' && window.self !== window.top;
      } catch (e) {
        isSandboxIframe = true;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] dark:bg-slate-900 px-4 py-12">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/35 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Something went wrong
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 leading-relaxed">
              An unexpected application script or feature error occurred. 
              {isSandboxIframe && " This may be due to browser sandbox limits of the preview frame. Try opening the application in a new window."}
            </p>

            {this.state.error && (
              <div className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 text-left mb-6 overflow-auto max-h-36 border border-gray-100 dark:border-slate-800">
                <p className="font-mono text-xs text-red-600 dark:text-red-400 break-words">
                  {this.state.error.name}: {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Reload App
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex justify-center items-center px-4 py-2 border border-gray-200 dark:border-slate-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Go to Homepage
              </button>
            </div>

            {isSandboxIframe && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-700/80">
                <a 
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                >
                  Open App in New Tab
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ErrorBoundary = SafeBoundary;
