import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Connection,
  type NodeMouseHandler,
  type OnNodeDrag,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { Folder, MindMap, NodeData } from '../types';
import {
  getMindMaps,
  createMindMap,
  deleteMindMap,
  moveMindMap,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getNodes,
  createRootNode,
  createChildNode,
  updateNode,
  deleteNode,
} from '../api/mindmap';

interface Props {
  onLogout: () => void;
}

interface FlowNodeData extends Record<string, unknown> {
  nodeData: NodeData;
  isEditing: boolean;
  onSave: (id: string, content: string) => void;
}

// 원(80x80) 위 8방향 핸들 위치 (중심 기준 반지름 40px)
const ROOT_R = 40;
const ROOT_DIRS = ['e','se','s','sw','w','nw','n','ne'] as const;
const ROOT_HANDLE_POSITIONS = ROOT_DIRS.map((dir, i) => {
  const angle = (i * 45 * Math.PI) / 180;
  return {
    dir,
    left: ROOT_R + ROOT_R * Math.cos(angle), // px
    top:  ROOT_R + ROOT_R * Math.sin(angle), // px
  };
});

function EditableNode({ id, data, selected }: NodeProps<Node<FlowNodeData>>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isRoot = data.nodeData.parentId === null;

  useEffect(() => {
    if (data.isEditing) setTimeout(() => inputRef.current?.focus(), 0);
  }, [data.isEditing]);

  const invisibleStyle = { width: 1, height: 1, minWidth: 0, minHeight: 0, background: 'transparent', border: 'none' };

  if (isRoot) {
    return (
      <div style={{ outline: 'none', position: 'relative', width: 80, height: 80 }}>
        {/* 8방향 source 핸들 */}
        {ROOT_HANDLE_POSITIONS.map(({ dir, left, top }) => (
          <Handle
            key={`src-${dir}`}
            id={`src-${dir}`}
            type="source"
            position={Position.Left}
            style={{ ...invisibleStyle, position: 'absolute', left, top, transform: 'translate(-50%,-50%)' }}
          />
        ))}
        {/* target 핸들 (좌/우) */}
        <Handle id="target-left"  type="target" position={Position.Left}  style={invisibleStyle} />
        <Handle id="target-right" type="target" position={Position.Right} style={invisibleStyle} />

        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          border: `1.5px solid ${selected ? '#000' : '#aaa'}`,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {data.isEditing ? (
            <input
              ref={inputRef}
              defaultValue={data.nodeData.content || ''}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#000', fontFamily: 'Paperlogy, sans-serif', width: 60, textAlign: 'center' }}
              onBlur={(e) => data.onSave(id, e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' || e.key === 'Escape') data.onSave(id, (e.target as HTMLInputElement).value);
              }}
            />
          ) : (
            <span style={{ fontSize: 13, color: '#000', fontFamily: 'Paperlogy, sans-serif', textAlign: 'center', wordBreak: 'break-all', padding: '0 8px' }}>
              {data.nodeData.content || ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ outline: 'none', padding: '4px 12px' }}>
      <Handle id="target-left"  type="target" position={Position.Left}  style={invisibleStyle} />
      <Handle id="target-right" type="target" position={Position.Right} style={invisibleStyle} />
      <Handle id="source-left"  type="source" position={Position.Left}  style={invisibleStyle} />
      <Handle id="source-right" type="source" position={Position.Right} style={invisibleStyle} />
      {data.isEditing ? (
        <input
          ref={inputRef}
          defaultValue={data.nodeData.content || ''}
          style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#000', fontFamily: 'Paperlogy, sans-serif', minWidth: 60 }}
          onBlur={(e) => data.onSave(id, e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === 'Escape') data.onSave(id, (e.target as HTMLInputElement).value);
          }}
        />
      ) : data.nodeData.content ? (
        <span style={{
          fontSize: 14, color: '#000', fontFamily: 'Paperlogy, sans-serif',
          borderBottom: selected ? '1.5px solid #000' : '1.5px solid transparent',
          paddingBottom: 1, whiteSpace: 'nowrap',
        }}>
          {data.nodeData.content}
        </span>
      ) : (
        <span style={{
          display: 'inline-block', minWidth: 60, height: 24,
          border: `1.5px dashed ${selected ? '#999' : '#ccc'}`,
          borderRadius: 4,
        }} />
      )}
    </div>
  );
}

const nodeTypes = { editable: EditableNode };

// 부모→자식 각도로 8방향 중 가장 가까운 핸들 ID 반환
function getClosestRootHandle(parent: NodeData, child: NodeData): string {
  const dx = child.positionX - parent.positionX;
  const dy = child.positionY - parent.positionY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 ~ 180
  if (angle < 0) angle += 360; // 0 ~ 360
  const idx = Math.round(angle / 45) % 8;
  return `src-${ROOT_DIRS[idx]}`;
}

function toFlow(nodes: NodeData[], editingId: string | null, onSave: (id: string, content: string) => void): { flowNodes: Node<FlowNodeData>[]; flowEdges: Edge[] } {
  return {
    flowNodes: nodes.map((n) => ({
      id: String(n.id), type: 'editable',
      position: { x: n.positionX, y: n.positionY },
      data: { nodeData: n, isEditing: editingId === String(n.id), onSave },
    })),
    flowEdges: nodes.filter((n) => n.parentId !== null).map((n) => {
      const parent = nodes.find((p) => p.id === n.parentId);
      const toLeft = parent ? n.positionX < parent.positionX : false;
      const isParentRoot = parent ? parent.parentId === null : false;
      const sourceHandle = isParentRoot && parent
        ? getClosestRootHandle(parent, n)
        : (toLeft ? 'source-left' : 'source-right');
      return {
        id: `e-${n.parentId}-${n.id}`,
        type: 'default',
        source: String(n.parentId!),
        target: String(n.id),
        sourceHandle,
        targetHandle: toLeft ? 'target-right' : 'target-left',
        style: { stroke: '#ccc', strokeWidth: 1 },
      };
    }),
  };
}

function Canvas({ mindMap }: { mindMap: MindMap }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<FlowNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const selectedNodeId = useRef<string | null>(null);
  const editingNodeId = useRef<string | null>(null);
  const rawNodes = useRef<NodeData[]>([]);

  const handleSave = useCallback(async (id: string, content: string) => {
    editingNodeId.current = null;
    const node = rawNodes.current.find((n) => String(n.id) === id);
    if (!node) return;
    // 낙관적 업데이트: 서버 응답을 기다리지 않고 즉시 UI 갱신 → 빠른 연속 Enter 시 race condition 방지
    const updated = rawNodes.current.map((n) => String(n.id) === id ? { ...n, content } : n);
    rawNodes.current = updated;
    const { flowNodes, flowEdges } = toFlow(updated, null, handleSave);
    setNodes(flowNodes); setEdges(flowEdges);
    innerRef.current?.focus();
    // 백그라운드에서 서버에 저장
    await updateNode(mindMap.id, Number(id), content, node.positionX, node.positionY);
  }, [mindMap.id, setNodes, setEdges]);

  const buildNodes = useCallback((data: NodeData[], editingId: string | null) => {
    rawNodes.current = data;
    const { flowNodes, flowEdges } = toFlow(data, editingId, handleSave);
    setNodes(flowNodes); setEdges(flowEdges);
  }, [handleSave, setNodes, setEdges]);

  const load = useCallback(async (editingId: string | null = null) => {
    const data = await getNodes(mindMap.id);
    buildNodes(data, editingId);
  }, [mindMap.id, buildNodes]);

  useEffect(() => { load(); innerRef.current?.focus(); }, [load]);

  const startEditing = useCallback((id: string) => {
    editingNodeId.current = id;
    buildNodes(rawNodes.current, id);
  }, [buildNodes]);

  // 특정 노드 위치로 뷰포트 부드럽게 이동
  const focusNode = useCallback((x: number, y: number) => {
    if (!rfInstance.current) return;
    rfInstance.current.setCenter(x, y, { zoom: rfInstance.current.getZoom(), duration: 300 });
  }, []);

  const selectNode = useCallback((id: string) => {
    selectedNodeId.current = id;
    setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === id })));
  }, [setNodes]);

  const handleKeyDown = useCallback(async (e: React.KeyboardEvent) => {
    if (editingNodeId.current) return;
    const selId = selectedNodeId.current;

    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault();
      if (!selId) return;
      const cur = rawNodes.current.find((n) => String(n.id) === selId);
      if (!cur) return;

      if (e.key === 'ArrowLeft') {
        // 부모로 이동
        if (cur.parentId) selectNode(String(cur.parentId));
      } else if (e.key === 'ArrowRight') {
        // 첫 번째 자식으로 이동
        const child = rawNodes.current
          .filter((n) => n.parentId === cur.id)
          .sort((a, b) => a.positionY - b.positionY)[0];
        if (child) selectNode(String(child.id));
      } else {
        // 형제 노드로 이동 (위/아래) - 루트끼리도 포함
        const siblings = rawNodes.current
          .filter((n) => n.parentId === cur.parentId)
          .sort((a, b) => a.positionY - b.positionY);
        const idx = siblings.findIndex((n) => n.id === cur.id);
        const next = e.key === 'ArrowUp' ? siblings[idx - 1] : siblings[idx + 1];
        if (next) selectNode(String(next.id));
      }
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (!selId) return;
      const parent = rawNodes.current.find((n) => String(n.id) === selId);
      if (!parent) return;
      // 부모(선택 노드)가 조부모 기준 어느 방향에 있는지 계산 → 자식도 같은 방향으로
      const grandparent = parent.parentId !== null
        ? rawNodes.current.find((n) => n.id === parent.parentId)
        : null;
      const goRight = grandparent ? parent.positionX >= grandparent.positionX : true;
      const childX = parent.positionX + (goRight ? 200 : -200);
      // 기존 자식 노드들 아래에 배치 (겹침 방지)
      const existingChildren = rawNodes.current.filter((n) => n.parentId === Number(selId));
      const childY = existingChildren.length > 0
        ? Math.max(...existingChildren.map((n) => n.positionY)) + 80
        : parent.positionY;
      const created = await createChildNode(mindMap.id, Number(selId), '', childX, childY);
      selectedNodeId.current = String(created.id);
      editingNodeId.current = String(created.id);
      await load(String(created.id));
      focusNode(created.positionX, created.positionY);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!selId) {
        if (rawNodes.current.length === 0) {
          const created = await createRootNode(mindMap.id, '');
          selectedNodeId.current = String(created.id);
          editingNodeId.current = String(created.id);
          await load(String(created.id));
          focusNode(created.positionX, created.positionY);
        }
        return;
      }
      const cur = rawNodes.current.find((n) => String(n.id) === selId);
      if (!cur) return;
      // 루트 노드면 자식 생성, 자식 노드면 형제 생성
      const isRoot = cur.parentId === null;
      const parentId = cur.parentId ?? cur.id;
      const newX = cur.positionX + (isRoot ? 200 : 0);
      // 같은 부모를 공유하는 노드들의 최하단 아래에 배치 (겹침 방지)
      const sameParentNodes = rawNodes.current.filter((n) => n.parentId === parentId);
      const newY = sameParentNodes.length > 0
        ? Math.max(...sameParentNodes.map((n) => n.positionY)) + 80
        : cur.positionY + (isRoot ? 0 : 80);
      const created = await createChildNode(mindMap.id, parentId, '', newX, newY);
      selectedNodeId.current = String(created.id);
      editingNodeId.current = String(created.id);
      await load(String(created.id));
      focusNode(created.positionX, created.positionY);
    }

    if ((e.key === 'Delete' || e.key === 'Backspace') && selId) {
      const cur = rawNodes.current.find((n) => String(n.id) === selId);
      if (!cur) return;

      // 이전 형제 찾기 (Y 기준 정렬 후 현재 노드 바로 앞)
      const allSiblings = rawNodes.current
        .filter((n) => n.parentId === cur.parentId)
        .sort((a, b) => a.positionY - b.positionY);
      const curIdx = allSiblings.findIndex((n) => n.id === cur.id);
      const prevSibling = allSiblings[curIdx - 1] ?? null;

      // 이전 형제 → 없으면 부모
      const nextFocus = prevSibling
        ? String(prevSibling.id)
        : cur.parentId ? String(cur.parentId) : null;

      await deleteNode(mindMap.id, Number(selId));
      selectedNodeId.current = nextFocus;
      await load();
      if (nextFocus) {
        selectNode(nextFocus);
        const nextNode = rawNodes.current.find((n) => String(n.id) === nextFocus);
        if (nextNode) focusNode(nextNode.positionX, nextNode.positionY);
      }
    }

    if (e.key === 'F2' && selId) startEditing(selId);
  }, [mindMap.id, load, startEditing, selectNode, focusNode]);

  const onNodeDragStop: OnNodeDrag<Node<FlowNodeData>> = useCallback(async (_, node) => {
    await updateNode(mindMap.id, Number(node.id), node.data.nodeData.content, node.position.x, node.position.y);
    const updated = rawNodes.current.map((n) =>
      String(n.id) === node.id ? { ...n, positionX: node.position.x, positionY: node.position.y } : n
    );
    rawNodes.current = updated;
    // 위치 변경 후 sourcePosition/targetPosition 재계산
    buildNodes(updated, editingNodeId.current);
  }, [mindMap.id, buildNodes]);

  const onNodeClick: NodeMouseHandler<Node<FlowNodeData>> = useCallback((_, node) => {
    selectedNodeId.current = node.id;
    innerRef.current?.focus();
  }, []);

  const onNodeDoubleClick: NodeMouseHandler<Node<FlowNodeData>> = useCallback((_, node) => {
    selectedNodeId.current = node.id;
    startEditing(node.id);
  }, [startEditing]);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const [showHelp, setShowHelp] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rfInstance = useRef<any>(null);

  const handleCanvasDoubleClick = useCallback(async (e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const target = e.target as HTMLElement;
    if (target.closest('.react-flow__node')) return;
    let posX = 100, posY = 100;
    if (rfInstance.current) {
      const pos = rfInstance.current.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      posX = pos.x; posY = pos.y;
    }
    const created = await createRootNode(mindMap.id, '');
    await updateNode(mindMap.id, created.id, '', posX, posY);
    selectedNodeId.current = String(created.id);
    editingNodeId.current = String(created.id);
    await load(String(created.id));
    focusNode(posX, posY);
  }, [mindMap.id, load, focusNode]);

  return (
    <div ref={innerRef} tabIndex={-1} style={{ flex: 1, position: 'relative', outline: 'none' }} onKeyDown={handleKeyDown} onDoubleClick={handleCanvasDoubleClick}>
      {/* 제목 */}
      <div style={{ position: 'absolute', top: 16, left: 0, right: 0, zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <strong style={{ fontSize: 18, fontFamily: 'Paperlogy, sans-serif', color: '#000' }}>{mindMap.title}</strong>
      </div>

      {/* ? 버튼 */}
      <button
        onClick={() => setShowHelp(true)}
        style={{ position: 'absolute', top: 16, right: 20, zIndex: 5, width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Paperlogy, sans-serif' }}
      >?</button>

      {/* 빈 캔버스 힌트 */}
      {nodes.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center', pointerEvents: 'none' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#ccc', fontFamily: 'Paperlogy, sans-serif' }}>Ctrl + 왼쪽 더블클릭으로 키워드를 만들어보세요</p>
        </div>
      )}

      {/* 사용법 모달 */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '28px 32px', minWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontFamily: 'Paperlogy, sans-serif' }}>사용법</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: '#444' }}>
              {[
                ['Ctrl + 더블 클릭', '키워드 생성'],
                ['Tab', '하위 키워드 생성'],
                ['Enter', '키워드 생성'],
                ['더블 클릭 (키워드)', '키워드 편집'],
                ['Delete / Backspace', '선택 키워드 삭제'],
                ['← → ↑ ↓', '키워드 이동'],
              ].map(([key, desc]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
                  <code style={{ background: '#f5f5f5', padding: '2px 8px', borderRadius: 6, fontSize: 13, fontFamily: 'monospace' }}>{key}</code>
                  <span>{desc}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowHelp(false)} style={{ marginTop: 24, width: '100%', padding: '10px', border: 'none', borderRadius: 10, background: '#000', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'Paperlogy, sans-serif' }}>닫기</button>
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onConnect={onConnect} onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick} onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes} style={{ background: '#fff' }} fitView
        onInit={(instance) => { rfInstance.current = instance; }}
        zoomOnDoubleClick={false}
      />
    </div>
  );
}


interface MindMapItemProps {
  m: MindMap;
  indent?: boolean;
  isSelected: boolean;
  isDragging: boolean;
  isEditing: boolean;
  editingTitle: string;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
  onTitleChange: (title: string) => void;
  onRename: () => void;
  onCancelEdit: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

function MindMapItem({ m, indent = false, isSelected, isDragging, isEditing, editingTitle, onDragStart, onDragEnd, onClick, onTitleChange, onRename, onCancelEdit, onStartEdit, onDelete }: MindMapItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `8px 16px 8px ${indent ? 28 : 16}px`,
        background: isSelected ? '#f0f0f0' : 'transparent',
        borderLeft: isSelected ? '3px solid #000' : '3px solid transparent',
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
      onClick={onClick}
    >
      {isEditing ? (
        <input
          autoFocus
          value={editingTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onRename}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') onRename(); if (e.key === 'Escape') onCancelEdit(); }}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1, fontSize: 13, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Paperlogy, sans-serif' }}
        />
      ) : (
        <span
          onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(); }}
          style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}
        >{m.title}</span>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 2px', lineHeight: 1, flexShrink: 0 }}
      >×</button>
    </div>
  );
}

export default function WorkspacePage({ onLogout }: Props) {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState<MindMap | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | 'root' | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingMindMapId, setEditingMindMapId] = useState<number | null>(null);
  const [editingMindMapTitle, setEditingMindMapTitle] = useState('');

  const loadAll = async () => {
    const [maps, flds] = await Promise.all([getMindMaps(), getFolders()]);
    setMindMaps(maps);
    setFolders(flds);
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateMindMap = async () => {
    const created = await createMindMap('새 마인드맵');
    setMindMaps((prev) => [...prev, created]);
    setSelected(created);
    setEditingMindMapId(created.id);
    setEditingMindMapTitle('새 마인드맵');
  };

  const handleRenameMindMap = async (id: number) => {
    const title = editingMindMapTitle.trim() || '새 마인드맵';
    await import('../api/mindmap').then(({ updateMindMap }) => updateMindMap(id, title));
    setMindMaps((prev) => prev.map((m) => m.id === id ? { ...m, title } : m));
    setSelected((prev) => prev?.id === id ? { ...prev, title } : prev);
    setEditingMindMapId(null);
  };

  const handleDelete = async (id: number) => {
    await deleteMindMap(id);
    if (selected?.id === id) setSelected(null);
    setMindMaps((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateFolder = async () => {
    const created = await createFolder('새 폴더');
    setFolders((prev) => [...prev, created]);
    setExpandedFolders((prev) => new Set(prev).add(created.id));
    setEditingFolderId(created.id);
    setEditingFolderName('새 폴더');
  };

  const handleRenameFolder = async (id: number) => {
    const name = editingFolderName.trim() || '새 폴더';
    await renameFolder(id, name);
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (id: number) => {
    await deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    setMindMaps((prev) => prev.map((m) => m.folderId === id ? { ...m, folderId: null } : m));
  };

  const handleMove = async (mindMapId: number, folderId: number | null) => {
    const target = mindMaps.find((m) => m.id === mindMapId);
    if (!target) return;
    await moveMindMap(mindMapId, target.title, folderId);
    setMindMaps((prev) => prev.map((m) => m.id === mindMapId ? { ...m, folderId } : m));
  };

  const toggleFolder = (id: number) =>
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  const onDrop = async (folderId: number | null) => {
    if (draggingId !== null) await handleMove(draggingId, folderId);
    setDraggingId(null);
    setDragOver(null);
  };


  const [sidebarOpen, setSidebarOpen] = useState(true);
  const uncategorized = mindMaps.filter((m) => m.folderId === null);
  const isDragOverRoot = dragOver === 'root';

  const handleStartEditMindMap = useCallback((m: MindMap) => {
    setEditingMindMapId(m.id);
    setEditingMindMapTitle(m.title);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* 사이드바 */}
      <div style={{ width: sidebarOpen ? 240 : 0, display: 'flex', flexDirection: 'column', borderRight: sidebarOpen ? '1px solid #eee' : 'none', background: '#fafafa', flexShrink: 0, overflow: 'hidden' }}>
        {/* 헤더 */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #eee' }}>
          <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16, letterSpacing: '-0.5px', textAlign: 'center' }}>Mind Keyword</p>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={handleCreateMindMap}
              style={{ flex: 1, padding: '8px 0', background: '#000', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Paperlogy, sans-serif' }}
            >+ 마인드맵</button>
            <button
              onClick={handleCreateFolder}
              style={{ flex: 1, padding: '8px 0', background: '#fff', color: '#444', border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'Paperlogy, sans-serif' }}
            >+ 폴더</button>
          </div>
        </div>

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* 폴더 */}
          {folders.map((folder) => {
            const folderMaps = mindMaps.filter((m) => m.folderId === folder.id);
            const isOpen = expandedFolders.has(folder.id);
            const isOver = dragOver === folder.id;
            return (
              <div key={folder.id}>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(folder.id); if (!isOpen) toggleFolder(folder.id); }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={(e) => { e.preventDefault(); onDrop(folder.id); }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '8px 16px', cursor: 'pointer',
                    background: isOver ? '#f0f4ff' : 'transparent',
                    borderLeft: isOver ? '3px solid #666' : '3px solid transparent',
                    transition: 'background 0.1s',
                  }}
                  onClick={() => toggleFolder(folder.id)}
                >
                  <span style={{ fontSize: 11, color: '#aaa', marginRight: 6, userSelect: 'none' }}>{isOpen ? '▼' : '▶'}</span>
                  {editingFolderId === folder.id ? (
                    <input
                      autoFocus
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => handleRenameFolder(folder.id)}
                      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') handleRenameFolder(folder.id); if (e.key === 'Escape') setEditingFolderId(null); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{ flex: 1, fontSize: 13, border: 'none', outline: 'none', background: 'transparent', fontFamily: 'Paperlogy, sans-serif', fontWeight: 500 }}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); setEditingFolderName(folder.name); }}
                      style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
                    >{folder.name}</span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 2px', lineHeight: 1 }}
                  >×</button>
                </div>
                {isOpen && folderMaps.map((m) => (
                  <MindMapItem
                    key={m.id} m={m} indent
                    isSelected={selected?.id === m.id}
                    isDragging={draggingId === m.id}
                    isEditing={editingMindMapId === m.id}
                    editingTitle={editingMindMapTitle}
                    onDragStart={() => setDraggingId(m.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                    onClick={() => setSelected(m)}
                    onTitleChange={(title) => setEditingMindMapTitle(title)}
                    onRename={() => handleRenameMindMap(m.id)}
                    onCancelEdit={() => setEditingMindMapId(null)}
                    onStartEdit={() => handleStartEditMindMap(m)}
                    onDelete={() => handleDelete(m.id)}
                  />
                ))}
                {isOpen && folderMaps.length === 0 && (
                  <p style={{ margin: 0, padding: '4px 28px 8px', fontSize: 12, color: '#ccc' }}>비어 있음</p>
                )}
              </div>
            );
          })}

          {/* 미분류 드롭존 */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver('root'); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => { e.preventDefault(); onDrop(null); }}
            style={{ minHeight: uncategorized.length === 0 ? 48 : 'auto', borderTop: folders.length > 0 ? '1px solid #f0f0f0' : 'none', background: isDragOverRoot ? '#f5f5f5' : 'transparent', transition: 'background 0.1s' }}
          >
            {uncategorized.map((m) => (
              <MindMapItem
                key={m.id} m={m}
                isSelected={selected?.id === m.id}
                isDragging={draggingId === m.id}
                isEditing={editingMindMapId === m.id}
                editingTitle={editingMindMapTitle}
                onDragStart={() => setDraggingId(m.id)}
                onDragEnd={() => { setDraggingId(null); setDragOver(null); }}
                onClick={() => setSelected(m)}
                onTitleChange={(title) => setEditingMindMapTitle(title)}
                onRename={() => handleRenameMindMap(m.id)}
                onCancelEdit={() => setEditingMindMapId(null)}
                onStartEdit={() => handleStartEditMindMap(m)}
                onDelete={() => handleDelete(m.id)}
              />
            ))}
            {mindMaps.length === 0 && folders.length === 0 && (
              <p style={{ padding: '12px 16px', color: '#bbb', fontSize: 13, margin: 0 }}>마인드맵이 없습니다</p>
            )}
          </div>
        </div>

        {/* 하단 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eee' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', border: '1px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: 'Paperlogy, sans-serif', color: '#888' }}>로그아웃</button>
        </div>
      </div>

      {/* 사이드바 토글 버튼 */}
      <button
        onClick={() => setSidebarOpen((v) => !v)}
        style={{
          position: 'fixed', top: 20, left: sidebarOpen ? 252 : 12, zIndex: 1000,
          width: 28, height: 28, borderRadius: 8,
          border: '1px solid #e0e0e0', background: '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: '#888', boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
        title={sidebarOpen ? '사이드바 닫기' : '사이드바 열기'}
      >
        {sidebarOpen ? '‹' : '›'}
      </button>

      {/* 캔버스 */}
      <div style={{ flex: 1, display: 'flex', outline: 'none', position: 'relative' }}>
        {selected ? (
          <Canvas key={selected.id} mindMap={selected} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#ccc' }}>
            <span style={{ fontSize: 40 }}>○</span>
            <p style={{ margin: 0, fontSize: 14 }}>왼쪽에서 마인드맵을 선택하거나 새로 만들어보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
