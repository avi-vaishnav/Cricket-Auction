"use client";
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Proceed",
  cancelText = "Cancel",
  isDestructive = false
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog box */}
      <div className="relative bg-zinc-900 border border-white/10 p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-xl ${isDestructive ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-400'}`}>
            <AlertCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-semibold text-sm bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/5"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all text-white shadow-lg ${
              isDestructive 
               ? "bg-red-600 hover:bg-red-500 shadow-red-600/30" 
               : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
