import React, { useState, useRef, useEffect, memo } from 'react';
import { useEmitterStore } from '../stores/emitterStore';
import { VariableSizeList } from 'react-window';

interface StreamLogPanelProps {
  initialWidth?: number;
}

interface LogEntryProps {
  log: string;
  style: React.CSSProperties;
}

// Move renderLogEntry outside of the main component
const renderLogEntry = (log: string) => {
  const match = log.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}) (\d+) ([a-zA-Z]+) (.+)$/);
  
  if (!match) return <span style={{ fontSize: '12px' }}>{log}</span>;

  const [_, timestamp, pgnId, name, data] = match;

  const innerData = data.slice(1, -1);
  const pairs = innerData.split('|');

  const formattedPairs = pairs.map((pair, index, array) => {
    const [key, value] = pair.split(':').map(s => s.trim());
    const cleanValue = value.replace(/}$/, '');
    
    return (
      `<span style="color: #d63384; font-weight: 500; display: inline-block; min-width: 0px">${key}</span>:` +
      `<span style="color: black; margin-left: 1px">${cleanValue}</span>` +
      (index === array.length - 1 ? '' : ' | ')
    );
  }).join('');

  const formattedData = '{ ' + formattedPairs + ' }';

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0px', 
      fontSize: '12px',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      padding: '2px',
      minHeight: '16'
    }}>
      <span style={{ color: '#888', width: '160px', flexShrink: 0 }}>{timestamp}</span>
      <span style={{ color: '#007bff', width: '60px', flexShrink: 0 }}>{pgnId}</span>
      <span style={{ color: '#28a745', width: '180px', flexShrink: 0 }}>{name}</span>
      <span 
        dangerouslySetInnerHTML={{ __html: formattedData }} 
        style={{ 
          flex: 1,
          minWidth: '200px',
          wordBreak: 'break-word'
        }} 
      />
    </div>
  );
};

const LogEntry = memo(({ log, style }: LogEntryProps) => {
  return (
    <div style={{ ...style, whiteSpace: 'pre-wrap' }}>
      {renderLogEntry(log)}
    </div>
  );
});

const StreamLogPanel: React.FC<StreamLogPanelProps> = ({ initialWidth = 800 }) => {
  const { streamLog, toggleStreamLog } = useEmitterStore();
  const [filterText, setFilterText] = useState('');
  const [panelHeight, setPanelHeight] = useState(400);
  const [panelWidth, setPanelWidth] = useState(initialWidth);
  const [isLive, setIsLive] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<VariableSizeList>(null);
  const sizeMap = useRef<{[key: number]: number}>({});

  // Filter logs based on input
  const filteredLogs = streamLog.filter(log => 
    log.toLowerCase().includes(filterText.toLowerCase())
  );

  // Update scroll position when new logs arrive
  useEffect(() => {
    if (isLive && listRef.current && filteredLogs.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToItem(filteredLogs.length - 1, 'end');
      });
    }
  }, [filteredLogs.length, isLive]);

  // Add function to get item size
  const getItemSize = (index: number) => {
    return sizeMap.current[index] || 60; // Default to 60px if not measured yet
  };

  // Add function to set item size
  const setItemSize = (index: number, size: number) => {
    sizeMap.current[index] = size;
    listRef.current?.resetAfterIndex(index);
  };

  // Update Row component to measure content
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const rowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (rowRef.current) {
        const height = rowRef.current.getBoundingClientRect().height;
        setItemSize(index, height);
      }
    }, [filteredLogs[index]]);

    return (
      <div ref={rowRef} style={{ ...style, height: 'auto' }}>
        <LogEntry log={filteredLogs[index]} style={{}} />
      </div>
    );
  };

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
      {/* Header with filter, live toggle, and close button */}
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
          }}
        />
        <div
          onClick={() => setIsLive(!isLive)}
          style={{
            cursor: 'pointer',
            padding: '4px 8px',
            fontSize: '12px',
            userSelect: 'none',
            backgroundColor: isLive ? 'var(--primary-blue)' : '#666',
            color: 'white',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isLive ? '⚡ Live' : '⏸️ Paused'}
        </div>
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

      {/* Log list container */}
      <div style={{ flex: 1 }}>
        <VariableSizeList
          ref={listRef}
          height={panelHeight - 45}
          width={panelWidth - 2}
          itemCount={filteredLogs.length}
          itemSize={getItemSize}
        >
          {Row}
        </VariableSizeList>
      </div>

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