
import React, { useState, useCallback, useRef } from 'react';

// --- SVG Icons (retained for functionality, styling adapted in JSX) ---

const StatusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18" />
    <path d="M18.7 8a6 6 0 0 0-8.1 0" />
    <path d="M12 14a2 2 0 0 0 2-2" />
    <path d="M16 11a5 5 0 0 0-8 0" />
  </svg>
);

const QrCodeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const HistoryIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <line x1="16" x2="8" y1="13" y2="13" />
    <line x1="16" x2="8" y1="17" y2="17" />
    <line x1="10" x2="8" y1="9" y2="9" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const Spinner: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

// --- Main Application Component ---

const App: React.FC = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>('http://localhost:8080');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [instanceName, setInstanceName] = useState<string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const historyRef = useRef<HTMLTextAreaElement>(null);

  const addToHistory = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setHistory(prev => [...prev, `[${timestamp}] ${message}`]);
    setTimeout(() => {
        if (historyRef.current) {
            historyRef.current.scrollTop = historyRef.current.scrollHeight;
        }
    }, 0);
  };

  const handleApiCall = useCallback(async <T extends any>(
    action: string,
    { endpoint, method, body }: { endpoint: string; method: 'GET' | 'POST'; body?: Record<string, any> },
    successCallback: (data: T) => string
  ) => {
    if (!apiBaseUrl) {
      addToHistory('ERRO: Endereço da API é obrigatório.');
      return;
    }
    if (!username || !password) {
      addToHistory('ERRO: Usuário e Senha são obrigatórios.');
      return;
    }
    if (!instanceName && endpoint !== '/info') {
      addToHistory('ERRO: Nome da instância é obrigatório.');
      return;
    }

    setLoading(prev => ({ ...prev, [action]: true }));
    addToHistory(`Iniciando ação: ${action} para a instância '${instanceName}'...`);
    
    try {
      const credentials = btoa(`${username}:${password}`);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      };

      let url = `${apiBaseUrl.replace(/\/$/, '')}${endpoint}`;
      if (method === 'GET') {
          const params = new URLSearchParams({ id: instanceName });
          url = `${url}?${params.toString()}`;
      }
      
      const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
      });

      const contentType = response.headers.get("content-type");
      let responseData: any;
      if (contentType && contentType.indexOf("application/json") !== -1) {
          responseData = await response.json();
      } else {
          responseData = await response.text();
      }

      if (!response.ok) {
          const errorMessage = typeof responseData === 'object' && responseData.message ? responseData.message : responseData;
          throw new Error(errorMessage || `HTTP error! status: ${response.status}`);
      }

      const successMessage = successCallback(responseData);
      addToHistory(`SUCESSO [${action}]: ${successMessage}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addToHistory(`ERRO [${action}]: ${errorMessage}`);
    } finally {
      setLoading(prev => ({ ...prev, [action]: false }));
    }
  }, [apiBaseUrl, username, password, instanceName]);


  const handleGetStatus = useCallback(() => {
    handleApiCall(
      'Status',
      { endpoint: '/info', method: 'GET' },
      (data: { connected: boolean; [key: string]: any }) => {
        const currentStatus = data.connected ? 'CONECTADO' : 'DESCONECTADO';
        setStatus(`Status da instância: ${currentStatus}`);
        return `Instância está ${currentStatus}.`;
      }
    );
  }, [handleApiCall]);

  const handleConnect = useCallback(() => {
    setQrCodeUrl(null);
    handleApiCall(
        'Conectar',
        { endpoint: '/login', method: 'POST', body: { id: instanceName } },
        (data: { qr?: string; message?: string }) => {
            if (data.qr) {
                setQrCodeUrl(data.qr);
                setStatus('AGUARDANDO LEITURA DO QR CODE');
                return 'QR Code gerado. Faça a leitura com seu WhatsApp para conectar.';
            }
            if (data.message) {
                setStatus(data.message.toUpperCase());
                return data.message;
            }
            return 'Resposta inesperada do servidor.';
        }
    );
  }, [handleApiCall, instanceName]);

  const handleDisconnect = useCallback(() => {
    handleApiCall(
        'Desconectar',
        { endpoint: '/logout', method: 'POST', body: { id: instanceName } },
        () => {
            setStatus('DESCONECTADO');
            setQrCodeUrl(null);
            return 'Sessão encerrada com sucesso.';
        }
    );
  }, [handleApiCall, instanceName]);

  const handleGetQRCode = useCallback(() => {
    setQrCodeUrl(null);
    handleApiCall(
        'QRCode',
        { endpoint: '/login', method: 'POST', body: { id: instanceName } },
        (data: { qr?: string; message?: string }) => {
            if (data.qr) {
                setQrCodeUrl(data.qr);
                setStatus('AGUARDANDO LEITURA DO QR CODE');
                return 'QR Code gerado/atualizado. Faça a leitura com seu WhatsApp.';
            }
            if (data.message) {
                setStatus(data.message.toUpperCase());
                return data.message;
            }
            return 'Resposta inesperada do servidor.';
        }
    );
  }, [handleApiCall, instanceName]);


  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex items-center justify-center p-4 font-sans">
      <main className="w-full max-w-6xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          
          {/* --- Left Column: Controls --- */}
          <div className="p-8 space-y-8 border-r border-slate-200">
            <header>
              <h1 className="text-3xl font-bold text-slate-900">Manage API Meon</h1>
              <p className="text-slate-500 mt-1">Gerencie sua instância e conecte seu WhatsApp</p>
            </header>

            {/* --- Configuration --- */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Configuração</h2>
              <div>
                <label htmlFor="apiBaseUrl" className="text-sm font-medium text-slate-700 mb-1 block">Endereço da API</label>
                <input
                  id="apiBaseUrl"
                  type="text"
                  placeholder="http://localhost:8080"
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="username" className="text-sm font-medium text-slate-700 mb-1 block">Usuário</label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Seu usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 mb-1 block">Senha</label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  />
                </div>
              </div>
            </section>
            
            {/* --- Instance Management --- */}
            <section className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Gerenciamento da Instância</h2>
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <input
                  type="text"
                  placeholder="Digite o nome da instância"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-md px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
                <button
                  onClick={handleGetStatus}
                  disabled={loading['Status']}
                  className="w-full sm:w-auto flex items-center justify-center px-5 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading['Status'] ? <Spinner className="h-5 w-5"/> : 'Status'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <button 
                  onClick={handleConnect}
                  disabled={loading['Conectar']}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center px-5 py-2.5 bg-emerald-500 text-white font-semibold rounded-md shadow-sm hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading['Conectar'] ? <Spinner className="h-5 w-5"/> : 'Conectar'}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={loading['Desconectar']}
                  className="flex items-center justify-center px-5 py-2.5 bg-red-500 text-white font-semibold rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading['Desconectar'] ? <Spinner className="h-5 w-5"/> : 'Desconectar'}
                </button>
                <button
                  onClick={handleGetQRCode}
                  disabled={loading['QRCode']}
                  className="flex items-center justify-center px-5 py-2.5 bg-amber-500 text-white font-semibold rounded-md shadow-sm hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading['QRCode'] ? <Spinner className="h-5 w-5"/> : 'QRCode'}
                </button>
              </div>
            </section>
          </div>

          {/* --- Right Column: Display & History --- */}
          <div className="p-8 bg-slate-50/70 space-y-6">
            <section>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <StatusIcon className="h-6 w-6 text-blue-500" />
                Status da Instância
              </h2>
              <div className="bg-white p-4 rounded-lg min-h-[4rem] flex items-center justify-center border border-slate-200">
                <p className="text-slate-500 italic">
                  {status ? status : 'Nenhum status carregado ainda.'}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <QrCodeIcon className="h-6 w-6 text-amber-500" />
                QR Code de Login
              </h2>
              <div className="bg-white p-4 rounded-lg min-h-[12rem] flex items-center justify-center border border-slate-200">
                {(loading['QRCode'] || loading['Conectar']) && <Spinner className="h-10 w-10 text-slate-500"/>}
                {!(loading['QRCode'] || loading['Conectar']) && qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="rounded-md w-44 h-44 object-cover bg-white p-1 border" />
                ) : (
                  !(loading['QRCode'] || loading['Conectar']) && <p className="text-slate-500 italic text-center">Clique em "QRCode" para gerar ou atualizar.</p>
                )}
              </div>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <HistoryIcon className="h-6 w-6 text-emerald-500" />
                Histórico de Ações
              </h2>
              <textarea
                ref={historyRef}
                readOnly
                value={history.join('\n')}
                className="w-full h-48 bg-slate-200 text-slate-700 font-mono text-xs p-4 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 resize-none"
                placeholder="O histórico de ações aparecerá aqui..."
              ></textarea>
            </section>
          </div>
        </div>
        <footer className="text-center p-4 bg-white border-t border-slate-200">
          <p className="text-xs text-slate-400">
            Mensagens amigáveis apenas — dados técnicos ficam no servidor.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
