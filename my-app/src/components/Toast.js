import React, { createContext, useContext, useState, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 3000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type, removing: false }]);

        // Otomatik kaldırma
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 300);
        }, duration);
    }, []);

    const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
    const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
    const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);
    const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, removing: true } : t));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    }, []);

    return (
        <ToastContext.Provider value={{ success, error, warning, info, addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`toast toast-${toast.type} ${toast.removing ? 'toast-exit' : 'toast-enter'}`}
                        onClick={() => removeToast(toast.id)}
                    >
                        <span className="toast-icon">
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✗'}
                            {toast.type === 'warning' && '⚠'}
                            {toast.type === 'info' && 'ℹ'}
                        </span>
                        <span className="toast-message">{toast.message}</span>
                        <button className="toast-close" onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}>×</button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
