import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { FilePlus, FolderPlus, Settings, Home, Download } from 'lucide-react';
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
  updateMindMap,
  deleteMindMap,
  moveMindMap,
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  createMindMapFromPdf,
  getNodes,
  createRootNode,
  createChildNode,
  updateNode,
  deleteNode,
} from '../api/mindmap';

interface Props {
  onLogout: () => void;
  onHome: () => void;
}

interface FlowNodeData extends Record<string, unknown> {
  nodeData: NodeData;
  isEditing: boolean;
  onSave: (id: string, content: string) => void;
  editingInitialValue?: string;
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
    if (!data.isEditing) return;
    const timer = setTimeout(() => {
      if (!inputRef.current) return;
      if (data.editingInitialValue !== undefined) {
        inputRef.current.value = data.editingInitialValue;
      }
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }, 0);
    return () => clearTimeout(timer);
  }, [data.isEditing, data.editingInitialValue]);

  const invisibleStyle = { width: 1, height: 1, minWidth: 0, minHeight: 0, background: 'transparent', border: 'none' };

  if (isRoot) {
    const content = data.nodeData.content || '';
    // 13px 폰트 기준 텍스트 너비 추정 → 원의 반지름 계산
    const textWidth = content.length * 7.5;
    const r = Math.max(ROOT_R, Math.ceil(textWidth / 2) + 20);
    const size = r * 2;
    const dynamicHandles = ROOT_DIRS.map((dir, i) => {
      const angle = (i * 45 * Math.PI) / 180;
      return { dir, left: r + r * Math.cos(angle), top: r + r * Math.sin(angle) };
    });

    return (
      <div style={{ outline: 'none', position: 'relative', width: size, height: size }}>
        {/* 8방향 source 핸들 */}
        {dynamicHandles.map(({ dir, left, top }) => (
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
          width: size, height: size, borderRadius: '50%',
          border: `1.5px solid ${selected ? '#000' : '#aaa'}`,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {data.isEditing ? (
            <input
              ref={inputRef}
              defaultValue={data.editingInitialValue !== undefined ? data.editingInitialValue : (data.nodeData.content || '')}
              style={{ border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#000', fontFamily: 'Paperlogy, sans-serif', width: size - 24, textAlign: 'center' }}
              onBlur={(e) => data.onSave(id, e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Tab') e.preventDefault();
                if (e.key === 'Enter' || e.key === 'Escape') data.onSave(id, (e.target as HTMLInputElement).value);
              }}
            />
          ) : (
            <span style={{ fontSize: 13, color: '#000', fontFamily: 'Paperlogy, sans-serif', textAlign: 'center', padding: `0 ${Math.max(8, r * 0.2)}px`, display: 'block', maxWidth: size - 16 }}>
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
          defaultValue={data.editingInitialValue !== undefined ? data.editingInitialValue : (data.nodeData.content || '')}
          style={{ border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: '#000', fontFamily: 'Paperlogy, sans-serif', minWidth: 60 }}
          onBlur={(e) => data.onSave(id, e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Tab') e.preventDefault(); // 브라우저 기본 Tab 포커스 이동 방지
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

// 텍스트 길이 기반 노드 너비 추정 (14px Paperlogy 기준, padding 24px)
function estimateNodeWidth(content: string): number {
  if (!content) return 60;
  return Math.max(60, content.length * 8.5 + 24);
}

// 루트 원의 반지름 추정
function estimateRootRadius(content: string): number {
  if (!content) return ROOT_R;
  return Math.max(ROOT_R, Math.ceil((content.length * 7.5) / 2) + 20);
}

// 부모 텍스트 길이를 고려한 수평 간격 계산
function calcXGap(parentContent: string, isParentRoot = false): number {
  if (isParentRoot) {
    const r = estimateRootRadius(parentContent);
    return Math.max(200, r + 120);
  }
  return Math.max(200, estimateNodeWidth(parentContent) + 80);
}

// 부모→자식 각도로 8방향 중 가장 가까운 핸들 ID 반환
function getClosestRootHandle(parent: NodeData, child: NodeData): string {
  const dx = child.positionX - parent.positionX;
  const dy = child.positionY - parent.positionY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI); // -180 ~ 180
  if (angle < 0) angle += 360; // 0 ~ 360
  const idx = Math.round(angle / 45) % 8;
  return `src-${ROOT_DIRS[idx]}`;
}

function toFlow(nodes: NodeData[], editingId: string | null, onSave: (id: string, content: string) => void, editingInitialValue?: string): { flowNodes: Node<FlowNodeData>[]; flowEdges: Edge[] } {
  return {
    flowNodes: nodes.map((n) => ({
      id: String(n.id), type: 'editable',
      position: { x: n.positionX, y: n.positionY },
      data: {
        nodeData: n,
        isEditing: editingId === String(n.id),
        onSave,
        editingInitialValue: editingId === String(n.id) ? editingInitialValue : undefined,
      },
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
  // 저장 직후 Enter/Tab이 즉시 새 노드를 만드는 현상 방지
  const justSaved = useRef(false);

  const handleSave = useCallback(async (id: string, content: string) => {
    editingNodeId.current = null;
    justSaved.current = true;
    setTimeout(() => { justSaved.current = false; }, 200);
    const node = rawNodes.current.find((n) => String(n.id) === id);
    if (!node) return;
    // 낙관적 업데이트: 서버 응답을 기다리지 않고 즉시 UI 갱신
    const updated = rawNodes.current.map((n) => String(n.id) === id ? { ...n, content } : n);
    rawNodes.current = updated;
    const { flowNodes, flowEdges } = toFlow(updated, null, handleSave);
    setNodes(flowNodes); setEdges(flowEdges);
    innerRef.current?.focus();
    // 백그라운드에서 서버에 저장
    await updateNode(mindMap.id, Number(id), content, node.positionX, node.positionY);
  }, [mindMap.id, setNodes, setEdges]);

  const buildNodes = useCallback((data: NodeData[], editingId: string | null, initialValue?: string) => {
    rawNodes.current = data;
    const { flowNodes, flowEdges } = toFlow(data, editingId, handleSave, initialValue);
    setNodes(flowNodes); setEdges(flowEdges);
  }, [handleSave, setNodes, setEdges]);

  const load = useCallback(async (editingId: string | null = null) => {
    const data = await getNodes(mindMap.id);
    buildNodes(data, editingId);
  }, [mindMap.id, buildNodes]);

  useEffect(() => { load(); innerRef.current?.focus(); }, [load]);

  const startEditing = useCallback((id: string, initialValue?: string) => {
    editingNodeId.current = id;
    buildNodes(rawNodes.current, id, initialValue);
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
    // input에 실제로 포커스가 있으면 EditableNode가 직접 처리
    if (editingNodeId.current && document.activeElement?.tagName === 'INPUT') return;
    // editingNodeId는 세팅됐지만 아직 input이 포커스를 못 받은 순간: 문자 키만 전달
    if (editingNodeId.current) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const pendingNode = rawNodes.current.find((n) => String(n.id) === editingNodeId.current);
        if (pendingNode) startEditing(editingNodeId.current, pendingNode.content ? undefined : e.key);
      }
      return;
    }
    // 저장 직후 Enter/Tab이 즉시 새 노드를 만드는 현상 방지
    if (justSaved.current && (e.key === 'Enter' || e.key === 'Tab')) return;
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
      const xGap = calcXGap(parent.content, parent.parentId === null);
      const childX = parent.positionX + (goRight ? xGap : -xGap);
      // 부모 노드 기준 같은 Y에 배치
      const childY = parent.positionY;
      const created = await createChildNode(mindMap.id, Number(selId), '', childX, childY);
      selectedNodeId.current = String(created.id);
      editingNodeId.current = String(created.id);
      buildNodes([...rawNodes.current, created], String(created.id));
      focusNode(created.positionX, created.positionY);
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (!selId) {
        if (rawNodes.current.length === 0) {
          const created = await createRootNode(mindMap.id, '');
          selectedNodeId.current = String(created.id);
          editingNodeId.current = String(created.id);
          buildNodes([created], String(created.id));
          focusNode(created.positionX, created.positionY);
        }
        return;
      }
      const cur = rawNodes.current.find((n) => String(n.id) === selId);
      if (!cur) return;
      // 루트 노드면 자식 생성, 자식 노드면 형제 생성
      const isRoot = cur.parentId === null;
      const parentId = cur.parentId ?? cur.id;
      const newX = cur.positionX + (isRoot ? calcXGap(cur.content, true) : 0);
      // 선택된 노드 기준 바로 아래에 배치
      const newY = cur.positionY + (isRoot ? 0 : 80);
      const created = await createChildNode(mindMap.id, parentId, '', newX, newY);
      selectedNodeId.current = String(created.id);
      editingNodeId.current = String(created.id);
      buildNodes([...rawNodes.current, created], String(created.id));
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

    // 일반 문자 키: 노드 선택 상태에서 바로 타이핑 시작
    // 빈 노드면 해당 글자가 첫 글자, 내용 있는 노드면 커서를 맨 끝에서 이어쓰기
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && selId) {
      const cur = rawNodes.current.find((n) => String(n.id) === selId);
      if (!cur) return;
      startEditing(selId, cur.content ? undefined : e.key);
    }
  }, [mindMap.id, load, buildNodes, startEditing, selectNode, focusNode]);

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
  const [isExporting, setIsExporting] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rfInstance = useRef<any>(null);

  const handleExportPdf = useCallback(async () => {
    if (!rfInstance.current || !innerRef.current || isExporting) return;
    setIsExporting(true);
    try {
      rfInstance.current.fitView({ padding: 0.15, duration: 0 });
      const flowEl = innerRef.current.querySelector('.react-flow') as HTMLElement;
      if (!flowEl) return;
      const dataUrl = await toPng(flowEl, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => { img.onload = () => resolve(); });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfW / img.width, pdfH / img.height);
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width * ratio, img.height * ratio);
      pdf.save(`${mindMap.title}.pdf`);
    } finally {
      setIsExporting(false);
    }
  }, [mindMap.title, isExporting]);

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

      {/* 상단 오른쪽 아이콘 버튼들 */}
      <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 5, display: 'flex', gap: 6 }}>
        <button
          tabIndex={-1}
          onClick={handleExportPdf}
          title="PDF 저장"
          disabled={isExporting}
          style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', cursor: isExporting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', opacity: isExporting ? 0.5 : 1 }}
          onMouseEnter={(e) => { if (!isExporting) { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; } }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd'; }}
        >
          <Download size={15} strokeWidth={1.8} />
        </button>
        <button
          tabIndex={-1}
          onClick={() => setShowHelp(true)}
          title="단축키 보기"
          style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: 14, fontWeight: 700, fontFamily: 'Paperlogy, sans-serif' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd'; }}
        >
          ?
        </button>
      </div>

      {/* 빈 캔버스 힌트 */}
      {nodes.length === 0 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, textAlign: 'center', pointerEvents: 'none' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#ccc', fontFamily: 'Paperlogy, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
            <code style={{ border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 13, color: '#999', background: '#fafafa' }}>Ctrl + 더블클릭</code>
            or
            <code style={{ border: '1px solid #ddd', borderRadius: 6, padding: '2px 7px', fontSize: 13, color: '#999', background: '#fafafa' }}>Enter</code>
            를 눌러 시작해보세요
          </p>
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
  indentLevel?: number;
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
  onContextMenu?: (e: React.MouseEvent) => void;
  isHovered?: boolean;
  disableHover?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

function MindMapItem({ m, indentLevel = 0, isSelected, isDragging, isEditing, editingTitle, onDragStart, onDragEnd, onClick, onTitleChange, onRename, onCancelEdit, onStartEdit, onDelete, onContextMenu, isHovered, disableHover, onMouseEnter, onMouseLeave }: MindMapItemProps) {
  return (
    <div
      draggable
      onDragStart={(e) => { e.stopPropagation(); onDragStart(); }}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `8px 16px 8px ${16 + indentLevel * 12}px`,
        background: isSelected ? '#f0f0f0' : (!disableHover && isHovered) ? '#f7f7f7' : 'transparent',
        borderLeft: isSelected ? '3px solid #000' : '3px solid transparent',
        opacity: isDragging ? 0.4 : 1,
        cursor: 'grab',
      }}
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
    </div>
  );
}

function CtxItem({ label, onClick, danger = false }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <div
      onClick={onClick}
      style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', color: danger ? '#e53935' : '#222', userSelect: 'none' }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = danger ? '#fff5f5' : '#f5f5f5'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >{label}</div>
  );
}

export default function WorkspacePage({ onLogout, onHome }: Props) {
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selected, setSelected] = useState<MindMap | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [draggingFolderId, setDraggingFolderId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | 'root' | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingMindMapId, setEditingMindMapId] = useState<number | null>(null);
  const [editingMindMapTitle, setEditingMindMapTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [hoveredItemKey, setHoveredItemKey] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const modalPdfInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'sidebar' | 'folder' | 'mindmap'; targetId?: number } | null>(null);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [contextMenu]);

  const loadAll = async () => {
    const [maps, flds] = await Promise.all([getMindMaps(), getFolders()]);
    setMindMaps(maps);
    setFolders(flds);
  };

  useEffect(() => { loadAll(); }, []);

  const handleCreateMindMap = async (folderId?: number) => {
    try {
      const created = await createMindMap('새 마인드맵', folderId);
      setMindMaps((prev) => [...prev, created]);
      setSelected(created);
      setEditingMindMapId(created.id);
      setEditingMindMapTitle('새 마인드맵');
    } catch (e: any) {
      const msg = e?.response?.data?.message ?? e?.message ?? String(e);
      console.error('마인드맵 생성 실패:', e);
      alert(`마인드맵 생성 실패 (${e?.response?.status ?? '?'}): ${msg}`);
    }
  };

  const handleRenameMindMap = async (id: number) => {
    const title = editingMindMapTitle.trim() || '새 마인드맵';
    await updateMindMap(id, title);
    setMindMaps((prev) => prev.map((m) => m.id === id ? { ...m, title } : m));
    setSelected((prev) => prev?.id === id ? { ...prev, title } : prev);
    setEditingMindMapId(null);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('파일을 삭제하시겠어요?')) return;
    await deleteMindMap(id);
    if (selected?.id === id) setSelected(null);
    setMindMaps((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreateFolder = async () => {
    try {
      const created = await createFolder('새 폴더', selectedFolderId ?? undefined);
      setFolders((prev) => [...prev, created]);
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        if (selectedFolderId) next.add(selectedFolderId);
        next.add(created.id);
        return next;
      });
      setEditingFolderId(created.id);
      setEditingFolderName('새 폴더');
    } catch (e) {
      console.error('폴더 생성 실패:', e);
      alert('폴더 생성에 실패했습니다. 백엔드 서버를 확인해주세요.');
    }
  };

  const handleRenameFolder = async (id: number) => {
    const name = editingFolderName.trim() || '새 폴더';
    await renameFolder(id, name);
    setFolders((prev) => prev.map((f) => f.id === id ? { ...f, name } : f));
    setEditingFolderId(null);
  };

  const handleDeleteFolder = async (id: number) => {
    if (!window.confirm('폴더와 안의 모든 하위 폴더, 파일이 삭제됩니다. 계속할까요?')) return;
    await deleteFolder(id);
    setSelectedFolderId(null);
    await loadAll();
    setSelected(null);
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

  const handlePdfSelect = (file: File) => {
    setPdfError(null);
    setSelectedPdfFile(file);
  };

  const handlePdfUpload = async () => {
    if (!selectedPdfFile) return;
    setPdfError(null);
    setIsPdfLoading(true);
    try {
      const created = await createMindMapFromPdf(selectedPdfFile);
      await loadAll();
      setSelected(created);
      setShowPdfModal(false);
      setSelectedPdfFile(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? String(err);
      setPdfError(`변환 실패: ${msg}`);
    } finally {
      setIsPdfLoading(false);
      if (modalPdfInputRef.current) modalPdfInputRef.current.value = '';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
  };

  // targetId가 ancestorId의 자손인지 확인 (순환 방지)
  const isDescendant = (targetId: number, ancestorId: number): boolean => {
    if (targetId === ancestorId) return true;
    const target = folders.find((f) => f.id === targetId);
    if (!target || target.parentId === null) return false;
    return isDescendant(target.parentId, ancestorId);
  };

  const handleMoveFolder = async (folderId: number, newParentId: number | null) => {
    if (newParentId !== null && isDescendant(newParentId, folderId)) return;
    try {
      await moveFolder(folderId, newParentId);
      await loadAll();
    } catch (e: any) {
      console.error('폴더 이동 실패:', e);
    }
  };

  const onDrop = async (targetId: number | null) => {
    if (draggingFolderId !== null) await handleMoveFolder(draggingFolderId, targetId);
    else if (draggingId !== null) await handleMove(draggingId, targetId);
    setDraggingId(null);
    setDraggingFolderId(null);
    setDragOver(null);
  };


  const [sidebarOpen, setSidebarOpen] = useState(true);
  const uncategorized = mindMaps.filter((m) => m.folderId === null);
  const isDragOverRoot = dragOver === 'root';

  // 평면 배열 → parentId 기준 children 맵
  const childrenOf = new Map<number, Folder[]>();
  folders.forEach((f) => {
    if (f.parentId !== null) {
      const arr = childrenOf.get(f.parentId) ?? [];
      childrenOf.set(f.parentId, [...arr, f]);
    }
  });
  const rootFolders = folders.filter((f) => f.parentId === null);

  const renderFolder = (folder: Folder, depth: number): ReactNode => {
    const subFolders = childrenOf.get(folder.id) ?? [];
    const folderMaps = mindMaps.filter((m) => m.folderId === folder.id);
    const isOpen = expandedFolders.has(folder.id);
    const isOver = dragOver === folder.id;
    const isFolderSelected = selectedFolderId === folder.id;
    const isFolderHovered = hoveredItemKey === `folder-${folder.id}`;
    const indentPx = 16 + depth * 12;
    return (
      <div key={folder.id}>
        <div
          draggable
          onDragStart={(e) => { e.stopPropagation(); setDraggingFolderId(folder.id); }}
          onDragEnd={() => { setDraggingFolderId(null); setDragOver(null); }}
          onMouseEnter={() => setHoveredItemKey(`folder-${folder.id}`)}
          onMouseLeave={() => setHoveredItemKey(null)}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFolderId(folder.id); setContextMenu({ x: e.clientX, y: e.clientY, type: 'folder', targetId: folder.id }); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(folder.id); if (!isOpen) toggleFolder(folder.id); }}
          onDragLeave={() => setDragOver(null)}
          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(folder.id); }}
          style={{
            display: 'flex', alignItems: 'center', padding: `8px 16px 8px ${indentPx}px`, cursor: 'pointer',
            background: isOver ? '#f0f4ff' : isFolderSelected ? '#f0f0f0' : (!selected && isFolderHovered) ? '#f7f7f7' : 'transparent',
            borderLeft: isOver ? '3px solid #666' : isFolderSelected ? '3px solid #000' : '3px solid transparent',
            opacity: draggingFolderId === folder.id ? 0.4 : 1,
            transition: 'background 0.1s',
          }}
          onClick={(e) => { e.stopPropagation(); setSelectedFolderId((prev) => prev === folder.id ? null : folder.id); }}
        >
          <span
            onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
            style={{ fontSize: 11, color: '#aaa', marginRight: 6, userSelect: 'none', padding: '2px 4px', borderRadius: 4, cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#e8e8e8'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >{isOpen ? '▼' : '▶'}</span>
          {editingFolderId === folder.id ? (
            <input
              autoFocus value={editingFolderName}
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
        </div>
        {isOpen && (
          <>
            {subFolders.map((child) => renderFolder(child, depth + 1))}
            {folderMaps.map((m) => (
              <MindMapItem
                key={m.id} m={m} indentLevel={depth + 1}
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
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'mindmap', targetId: m.id }); }}
                isHovered={hoveredItemKey === `mindmap-${m.id}`}
                disableHover={!!selected}
                onMouseEnter={() => setHoveredItemKey(`mindmap-${m.id}`)}
                onMouseLeave={() => setHoveredItemKey(null)}
              />
            ))}
            {subFolders.length === 0 && folderMaps.length === 0 && (
              <p style={{ margin: 0, padding: `4px ${indentPx + 12}px 8px`, fontSize: 12, color: '#ccc' }}>비어 있음</p>
            )}
          </>
        )}
      </div>
    );
  };

  const handleStartEditMindMap = useCallback((m: MindMap) => {
    setEditingMindMapId(m.id);
    setEditingMindMapTitle(m.title);
  }, []);

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* 사이드바 */}
      <div style={{ width: sidebarOpen ? 240 : 0, display: 'flex', flexDirection: 'column', borderRight: sidebarOpen ? '1px solid #eee' : 'none', background: '#fafafa', flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
        {/* 헤더 */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleCreateMindMap(selectedFolderId ?? undefined)}
              title="새 마인드맵"
              style={{ width: 30, height: 30, background: 'transparent', color: '#000', border: '1.5px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; }}
            >
              <FilePlus size={15} strokeWidth={1.8} />
            </button>
            <button
              onClick={handleCreateFolder}
              title={selectedFolderId ? '하위 폴더 추가' : '새 폴더'}
              style={{ width: 30, height: 30, background: 'transparent', color: '#000', border: '1.5px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; }}
            >
              <FolderPlus size={15} strokeWidth={1.8} />
            </button>
            {/* PDF AI 변환 — 오른쪽 끝 */}
            <style>{`
              @keyframes ai-shimmer {
                0%   { background-position: 0% 50%; }
                50%  { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              .ai-btn {
                background: linear-gradient(135deg, #a855f7, #6366f1, #3b82f6, #ec4899);
                background-size: 300% 300%;
                animation: ai-shimmer 3s ease infinite;
                box-shadow: 0 0 8px rgba(139, 92, 246, 0.6);
                transition: box-shadow 0.2s, transform 0.15s;
              }
              .ai-btn:hover {
                box-shadow: 0 0 14px rgba(139, 92, 246, 0.9), 0 0 4px rgba(236, 72, 153, 0.6);
                transform: scale(1.08);
              }
            `}</style>
            <button
              onClick={() => { setPdfError(null); setShowPdfModal(true); }}
              disabled={isPdfLoading}
              title="PDF로 마인드맵 생성"
              className="ai-btn"
              style={{ width: 30, height: 30, border: 'none', borderRadius: 8, cursor: isPdfLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', marginLeft: 'auto' }}
            >
              {isPdfLoading
                ? <span style={{ fontSize: 11 }}>…</span>
                : <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '-0.3px', fontFamily: 'Paperlogy, sans-serif', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>AI</span>
              }
            </button>
          </div>
        </div>

        {/* 목록 */}
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}
          onClick={() => { setSelectedFolderId(null); setSelected(null); }}
          onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'sidebar' }); }}
        >
          {/* 폴더 트리 */}
          {rootFolders.map((folder) => renderFolder(folder, 0))}

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
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setContextMenu({ x: e.clientX, y: e.clientY, type: 'mindmap', targetId: m.id }); }}
                isHovered={hoveredItemKey === `mindmap-${m.id}`}
                disableHover={!!selected}
                onMouseEnter={() => setHoveredItemKey(`mindmap-${m.id}`)}
                onMouseLeave={() => setHoveredItemKey(null)}
              />
            ))}
          </div>
        </div>

        {/* 하단 버튼들 */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 6 }}>
          <button
            onClick={onHome}
            title="홈으로"
            style={{ width: 30, height: 30, background: 'transparent', color: '#000', border: '1.5px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; }}
          >
            <Home size={15} strokeWidth={1.8} />
          </button>
          <button
            title="설정"
            style={{ width: 30, height: 30, background: 'transparent', color: '#000', border: '1.5px solid #ddd', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#aaa'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#ddd'; }}
          >
            <Settings size={15} strokeWidth={1.8} />
          </button>
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

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed', top: Math.min(contextMenu.y, window.innerHeight - 180), left: Math.min(contextMenu.x, window.innerWidth - 180),
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 2000, minWidth: 160, padding: '4px 0',
            fontFamily: 'Paperlogy, sans-serif',
          }}
        >
          {contextMenu.type === 'folder' && (() => {
            const f = folders.find((x) => x.id === contextMenu.targetId);
            return (<>
              <CtxItem label="새 마인드맵" onClick={() => { handleCreateMindMap(contextMenu.targetId); setContextMenu(null); }} />
              <CtxItem label="새 폴더" onClick={() => { handleCreateFolder(); setContextMenu(null); }} />
              <div style={{ height: 1, background: '#f0f0f0', margin: '4px 0' }} />
              <CtxItem label="이름 변경" onClick={() => { if (f) { setEditingFolderId(f.id); setEditingFolderName(f.name); } setContextMenu(null); }} />
              <CtxItem label="삭제" danger onClick={() => { setContextMenu(null); if (contextMenu.targetId) handleDeleteFolder(contextMenu.targetId); }} />
            </>);
          })()}
          {contextMenu.type === 'mindmap' && (() => {
            const m = mindMaps.find((x) => x.id === contextMenu.targetId);
            return (<>
              <CtxItem label="이름 변경" onClick={() => { if (m) handleStartEditMindMap(m); setContextMenu(null); }} />
              <CtxItem label="삭제" danger onClick={() => { setContextMenu(null); if (contextMenu.targetId) handleDelete(contextMenu.targetId); }} />
            </>);
          })()}
          {contextMenu.type === 'sidebar' && (<>
            <CtxItem label="새 마인드맵" onClick={() => { handleCreateMindMap(selectedFolderId ?? undefined); setContextMenu(null); }} />
            <CtxItem label="새 폴더" onClick={() => { handleCreateFolder(); setContextMenu(null); }} />
          </>)}
        </div>
      )}

      {/* PDF AI 변환 모달 */}
      {showPdfModal && (
        <div
          onClick={() => { if (!isPdfLoading) { setShowPdfModal(false); setPdfError(null); setSelectedPdfFile(null); } }}
          style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '32px 36px 28px', width: 480, boxShadow: '0 12px 40px rgba(0,0,0,0.15)', fontFamily: 'Paperlogy, sans-serif', position: 'relative' }}>
            <button
              onClick={() => { if (!isPdfLoading) { setShowPdfModal(false); setPdfError(null); setSelectedPdfFile(null); } }}
              disabled={isPdfLoading}
              style={{ position: 'absolute', top: 16, right: 16, width: 28, height: 28, border: 'none', borderRadius: '50%', background: 'none', cursor: isPdfLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: 18, lineHeight: 1 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#000'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa'; }}
            >✕</button>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888', lineHeight: 1.6 }}>
              PDF 파일을 AI가 분석해 마인드맵을 자동으로 만들어 드립니다.<br/>텍스트 기반 PDF만 지원합니다.
            </p>
            <input
              ref={modalPdfInputRef}
              type="file" accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePdfSelect(f); }}
            />
            <div
              onClick={() => { if (!isPdfLoading && !selectedPdfFile) modalPdfInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); if (!selectedPdfFile) setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragOver(false); const f = e.dataTransfer.files?.[0]; if (f && !isPdfLoading && !selectedPdfFile) handlePdfSelect(f); }}
              style={{
                border: `2px dashed ${isDragOver ? '#000' : selectedPdfFile ? '#aaa' : '#ddd'}`,
                borderRadius: 12, padding: '32px 20px',
                textAlign: 'center', cursor: isPdfLoading || selectedPdfFile ? 'default' : 'pointer',
                background: isDragOver ? '#f8f8f8' : '#fafafa',
                transition: 'all 0.15s', marginBottom: 12,
              }}
            >
              {isPdfLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <p style={{ margin: 0, fontSize: 13, color: '#999' }}>AI가 분석 중입니다…</p>
                </div>
              ) : selectedPdfFile ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#333', fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedPdfFile.name}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPdfFile(null); if (modalPdfInputRef.current) modalPdfInputRef.current.value = ''; }}
                    style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >다른 파일 선택</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: isDragOver ? '#e8e8e8' : '#efefef', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={isDragOver ? '#000' : '#888'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="12" y1="18" x2="12" y2="12"/>
                      <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: '#222', fontWeight: 600 }}>클릭하거나 파일을 끌어다 놓으세요</p>
                </div>
              )}
            </div>
            {pdfError && <p style={{ margin: '0 0 12px', fontSize: 12, color: '#e53935' }}>{pdfError}</p>}
            {selectedPdfFile && !isPdfLoading && (
              <button
                onClick={handlePdfUpload}
                style={{ width: '100%', padding: '11px', border: 'none', borderRadius: 10, background: '#000', color: '#fff', cursor: 'pointer', fontSize: 14, fontFamily: 'Paperlogy, sans-serif', fontWeight: 600 }}
              >AI 변환</button>
            )}
          </div>
        </div>
      )}

      {/* 캔버스 */}
      <div style={{ flex: 1, display: 'flex', outline: 'none', position: 'relative' }}>
        {selected ? (
          <Canvas key={selected.id} mindMap={selected} />
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={() => handleCreateMindMap(selectedFolderId ?? undefined)}
              style={{ padding: '16px 40px', background: 'transparent', color: '#000', border: '1.5px solid #000', borderRadius: 50, cursor: 'pointer', fontSize: 17, fontFamily: 'Paperlogy, sans-serif', letterSpacing: '-0.3px', transition: 'background 0.15s, color 0.15s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000'; }}
            >파일 생성하기</button>
          </div>
        )}
      </div>
    </div>
  );
}
