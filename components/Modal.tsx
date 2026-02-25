"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    maxWidth?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    maxWidth = "max-w-2xl",
}: ModalProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (isOpen) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,8,40,0.75)] backdrop-blur-sm transition-opacity duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`${maxWidth} w-[90%] max-h-[90vh] overflow-auto rounded-xl bg-white shadow-[0_20px_60px_rgba(0,0,0,0.3),0_8px_20px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-200`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">{children}</div>

                {/* Footer */}
                {footer && (
                    <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
