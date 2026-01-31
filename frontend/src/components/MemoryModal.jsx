import React, { useEffect, useState } from 'react';
import { api } from '../api';
import './MemoryModal.css';

export default function MemoryModal({ isOpen, onClose }) {
    const [memories, setMemories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadMemories();
        }
    }, [isOpen]);

    const loadMemories = async () => {
        setIsLoading(true);
        try {
            const data = await api.getMemories();
            setMemories(data);
        } catch (error) {
            console.error('Failed to load memories:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Your Memories</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    {isLoading ? (
                        <div className="loading">Loading memories...</div>
                    ) : memories.length === 0 ? (
                        <div className="no-memories">No memories found.</div>
                    ) : (
                        <table className="memories-table">
                            <thead>
                                <tr>
                                    <th>Memory Content</th>
                                    <th className="date-col">Created On</th>
                                </tr>
                            </thead>
                            <tbody>
                                {memories.map((mem) => (
                                    <tr key={mem.id}>
                                        <td>{mem.memory}</td>
                                        <td className="date-col">
                                            {new Date(mem.created_at || Date.now()).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
