import * as React from 'react';
import { useState, useEffect } from 'react';
import { NoteSelectionModalProps } from '../types/interfaces';

export const NoteSelectionModal: React.FC<NoteSelectionModalProps> = ({ 
    isOpen, 
    onClose, 
    onApply, 
    files,
    selectedPaths = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
    const [filteredFiles, setFilteredFiles] = useState(files);

    useEffect(() => {
        if (isOpen) {
            setSelectedNotes(selectedPaths);
            setSearchQuery('');
        }
    }, [isOpen, selectedPaths]);

    useEffect(() => {
        const filtered = files.filter(file => 
            file.basename.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredFiles(filtered);
    }, [searchQuery, files]);

    const handleToggleNote = (path: string) => {
        setSelectedNotes(prev => 
            prev.includes(path)
                ? prev.filter(p => p !== path)
                : [...prev, path]
        );
    };

    const handleApply = () => {
        onApply(selectedNotes);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="note-selection-overlay" onClick={onClose} />
            <div className="note-selection-modal">
                <div className="note-selection-header">
                    <h3 className="note-selection-title">Select Notes for Context</h3>
                </div>
                
                <div className="note-selection-search">
                    <input
                        type="text"
                        placeholder="Search notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="note-selection-list custom-scrollbar">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.path}
                            className={`note-selection-item ${selectedNotes.includes(file.path) ? 'selected' : ''}`}
                            onClick={() => handleToggleNote(file.path)}
                        >
                            <div className="note-selection-checkbox">
                                {selectedNotes.includes(file.path) && '✓'}
                            </div>
                            <span className="note-selection-item-title">{file.basename}</span>
                        </div>
                    ))}
                </div>

                <div className="note-selection-footer">
                    <button className="note-selection-button cancel" onClick={onClose}>
                        Cancel
                    </button>
                    <button 
                        className="note-selection-button apply"
                        onClick={handleApply}
                    >
                        Apply ({selectedNotes.length})
                    </button>
                </div>
            </div>
        </>
    );
}; 