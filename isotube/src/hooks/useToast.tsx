import {createContext, useCallback, useContext, useState, type ReactNode} from 'react';

interface Toast {
    id: number;
    message: string;
    type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
    toast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({children}: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((message: string, type: Toast['type'] = 'error') => {
        const id = nextId++;
        setToasts(prev => [...prev, {id, message, type}]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 6000);
    }, []);

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{toast: addToast}}>
            {children}
            {/* Toast container */}
            {toasts.length > 0 && (
                <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
                    {toasts.map(t => (
                        <div
                            key={t.id}
                            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm animate-in slide-in-from-right fade-in duration-200 ${
                                t.type === 'error'
                                    ? 'bg-red-950 border-red-800 text-red-200'
                                    : t.type === 'success'
                                        ? 'bg-green-950 border-green-800 text-green-200'
                                        : 'bg-gray-800 border-gray-700 text-gray-200'
                            }`}
                        >
                            <span className="flex-1">{t.message}</span>
                            <button
                                onClick={() => removeToast(t.id)}
                                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                            >
                                &times;
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}
