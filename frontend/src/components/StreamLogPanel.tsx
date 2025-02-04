import React, { useState, useRef, useEffect } from 'react';
import { useEmitterStore } from '../stores/emitterStore';

interface StreamLogPanelProps {
  initialWidth?: number;
}

const StreamLogPanel: React.FC<StreamLogPanelProps> = ({ initialWidth = 800 }) => {
  const { streamLog, toggleStreamLog } = useEmitterStore();
  const [filterText, setFilterText] = useState('');
  const [panelHeight, setPanelHeight] = useState(400);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isLive, setIsLive] = useState(true);
  const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Filter logs based on input
  const filteredLogs = streamLog.filter(log => 
    log.toLowerCase().includes(filterText.toLowerCase())
  );

  // Update displayed logs only when in live mode
  useEffect(() => {
    if (isLive) {
      setDisplayedLogs(filteredLogs);
    }
  }, [filteredLogs, isLive]);

  // Check if scrolled away from bottom
  const handleScroll = () => {
    if (logContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10;
      if (isAtBottom && !isLive) {
        setIsLive(true);
        setDisplayedLogs(filteredLogs);
      } else if (!isAtBottom && isLive) {
        setIsLive(false);
        setDisplayedLogs(filteredLogs);
      }
    }
  };

  // Auto scroll to bottom when new logs arrive if in live mode
  useEffect(() => {
    if (logContainerRef.current && isLive) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [displayedLogs, isLive]);

  const scrollToBottom = () => {
    if (logContainerRef.current) {
      setDisplayedLogs(filteredLogs);
      setIsLive(true);
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  };

  // Handle clicks outside the panel
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
//         toggleStreamLog();
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, [toggleStreamLog]);

  return (
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: `${panelWidth}px`,
        height: `${panelHeight}px`,
        backgroundColor: '#f5f5f5',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1000,
      }}
    >
      {/* Header with filter and close button */}
      <div style={{ 
        padding: '8px', 
        borderBottom: '1px solid #ccc',
        display: 'flex',
        gap: '8px',
        alignItems: 'center'
      }}>
        <input
          type="text"
          placeholder="Filter logs..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxSizing: 'border-box',
          }}
        />
        <div
          onClick={toggleStreamLog}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '14px',
            userSelect: 'none',
            color: '#666',
          }}
        >
          ✕
        </div>
      </div>

      {/* Logs container */}
      <div
        ref={logContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
          fontSize: '12px',
          fontFamily: 'monospace',
          position: 'relative',  // For positioning the live button
        }}
      >
        {displayedLogs.map((log, index) => (
          <div key={index} style={{ marginBottom: '4px' }}>
            {log}
          </div>
        ))}
      </div>

      {/* Live button - only shown when not at bottom */}
      {!isLive && (
        <div
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '15px',
            backgroundColor: 'var(--primary-blue)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            userSelect: 'none',
          }}
        >
          Go Live
        </div>
      )}

      {/* Resize handles */}
      <div
        style={{
          height: '6px',
          cursor: 'ns-resize',
          backgroundColor: '#f0f0f0',
          borderTop: '1px solid #ccc',
        }}
        onMouseDown={(e) => {
          const startY = e.clientY;
          const startHeight = panelHeight;

          const onMouseMove = (e: MouseEvent) => {
            const delta = e.clientY - startY;
            setPanelHeight(Math.max(200, startHeight + delta));
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '6px',
          cursor: 'ew-resize',
          backgroundColor: '#f0f0f0',
          borderRight: '1px solid #ccc',
        }}
        onMouseDown={(e) => {
          const startX = e.clientX;
          const startWidth = panelWidth;

          const onMouseMove = (e: MouseEvent) => {
            const delta = startX - e.clientX;
            setPanelWidth(Math.max(300, startWidth + delta));
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        }}
      />
    </div>
  );
};

export default StreamLogPanel; 