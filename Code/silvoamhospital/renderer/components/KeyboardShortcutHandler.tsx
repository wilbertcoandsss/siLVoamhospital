import React, { useEffect } from 'react';

const KeyboardShortcutHandler = ({ shortcuts }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            // Check if Ctrl key is pressed along with the specified key
            shortcuts.forEach((shortcut) => {
                if (event.ctrlKey && event.key === shortcut.key) {
                    shortcut.action();
                    event.preventDefault();
                }
            });
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [shortcuts]);

    return null;
};

export default KeyboardShortcutHandler;