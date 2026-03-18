import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FaPen,
  FaEraser,
  FaTrash,
  FaSave,
  FaUndo,
  FaCircle,
  FaSquare,
  FaLine,
  FaFont,
  FaTimes,
  FaEye,
  FaDownload,
  FaShare,
} from "react-icons/fa";

const WHITEBOARD_STORAGE_KEY = "xf_whiteboards";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState("pen"); // pen, eraser, circle, square, line, text
  const [color, setColor] = useState("#ffffff");
  const [brushSize, setBrushSize] = useState(3);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [whiteboards, setWhiteboards] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("Untitled Board");
  const [notes, setNotes] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showViewBoards, setShowViewBoards] = useState(false);
  const [viewTitle, setViewTitle] = useState("");
  const [addTextMode, setAddTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth - 400; // Leaving space for sidebar
    canvas.height = window.innerHeight - 120;

    const context = canvas.getContext("2d");
    context.fillStyle = "#1a1a1a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    contextRef.current = context;

    // Save initial state
    saveCanvasState();

    const handleResize = () => {
      const oldCanvas = canvas.toDataURL();
      canvas.width = window.innerWidth - 400;
      canvas.height = window.innerHeight - 120;
      const img = new Image();
      img.src = oldCanvas;
      img.onload = () => {
        context.fillStyle = "#1a1a1a";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
      };
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load whiteboards from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(WHITEBOARD_STORAGE_KEY);
    if (saved) {
      try {
        setWhiteboards(JSON.parse(saved));
      } catch {
        console.error("Failed to load whiteboards");
      }
    }
  }, []);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      const img = new Image();
      img.src = history[newStep];
      img.onload = () => {
        contextRef.current.fillStyle = "#1a1a1a";
        contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        contextRef.current.drawImage(img, 0, 0);
      };
    }
  };

  const clearCanvas = () => {
    if (window.confirm("Clear the entire whiteboard?")) {
      contextRef.current.fillStyle = "#1a1a1a";
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveCanvasState();
      setNotes("");
    }
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    setStartX(offsetX);
    setStartY(offsetY);
    setIsDrawing(true);

    if (mode === "text" && !addTextMode) {
      setAddTextMode(true);
      return;
    }

    contextRef.current.strokeStyle = color;
    contextRef.current.fillStyle = color;
    contextRef.current.lineWidth = brushSize;
    contextRef.current.lineCap = "round";
    contextRef.current.lineJoin = "round";

    if (mode === "pen") {
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
    }
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;

    const { offsetX, offsetY } = nativeEvent;
    const context = contextRef.current;

    if (mode === "pen") {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else if (mode === "eraser") {
      context.clearRect(offsetX - brushSize / 2, offsetY - brushSize / 2, brushSize, brushSize);
    }
  };

  const endDrawing = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const context = contextRef.current;

    if (mode === "pen") {
      context.lineTo(offsetX, offsetY);
      context.stroke();
    } else if (mode === "circle") {
      const radius = Math.sqrt((offsetX - startX) ** 2 + (offsetY - startY) ** 2);
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.beginPath();
      context.arc(startX, startY, radius, 0, 2 * Math.PI);
      context.stroke();
    } else if (mode === "square") {
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.strokeRect(startX, startY, offsetX - startX, offsetY - startY);
    } else if (mode === "line") {
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      context.beginPath();
      context.moveTo(startX, startY);
      context.lineTo(offsetX, offsetY);
      context.stroke();
    }

    setIsDrawing(false);
    saveCanvasState();
  };

  const handleTextAdd = () => {
    if (!textInput.trim()) return;
    const context = contextRef.current;
    context.font = `${brushSize * 8}px Arial`;
    context.fillStyle = color;
    context.fillText(textInput, startX, startY);
    setTextInput("");
    setAddTextMode(false);
    saveCanvasState();
  };

  const downloadWhiteboard = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${currentTitle}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    toast.success("Whiteboard downloaded!");
  };

  const saveWhiteboard = () => {
    if (!viewTitle.trim()) {
      toast.error("Enter a title for this whiteboard");
      return;
    }
    const canvas = canvasRef.current;
    const newBoard = {
      id: Date.now(),
      title: viewTitle,
      canvas: canvas.toDataURL(),
      notes,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
    };

    const updated = [...whiteboards, newBoard];
    localStorage.setItem(WHITEBOARD_STORAGE_KEY, JSON.stringify(updated));
    setWhiteboards(updated);
    setShowSaveDialog(false);
    setViewTitle("");
    toast.success(`Whiteboard "${viewTitle}" saved!`);
  };

  const loadWhiteboard = (board) => {
    const img = new Image();
    img.src = board.canvas;
    img.onload = () => {
      contextRef.current.fillStyle = "#1a1a1a";
      contextRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      contextRef.current.drawImage(img, 0, 0);
      setCurrentTitle(board.title);
      setNotes(board.notes);
      saveCanvasState();
      setShowViewBoards(false);
      toast.success(`Loaded "${board.title}"`);
    };
  };

  const deleteWhiteboard = (id) => {
    if (window.confirm("Delete this whiteboard?")) {
      const updated = whiteboards.filter((b) => b.id !== id);
      localStorage.setItem(WHITEBOARD_STORAGE_KEY, JSON.stringify(updated));
      setWhiteboards(updated);
      toast.success("Whiteboard deleted");
    }
  };

  const shareWhiteboard = (board) => {
    const shareText = `Check out my whiteboard: "${board.title}"\n\n${board.notes || "No notes"}`;
    if (navigator.share) {
      navigator.share({
        title: board.title,
        text: shareText,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Whiteboard info copied to clipboard");
    }
  };

  const toolClass = (toolMode) =>
    `flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
      mode === toolMode
        ? "bg-violet-600 text-white shadow-lg"
        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
    }`;

  return (
    <div className="flex h-screen bg-[#1a1a1a] text-white gap-4 p-3">
      {/* Canvas Area */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Top Toolbar */}
        <div className="bg-zinc-900 rounded-lg p-3 flex items-center justify-between border border-zinc-800">
          <div className="flex items-center gap-2">
          <div className="text-sm font-semibold truncate max-w-72">{currentTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowViewBoards(true)}
              className="flex items-center gap-2 px-3 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm transition-colors"
              title="View saved whiteboards"
            >
              <FaEye size={14} />
              Saved Boards
            </button>
            <button
              onClick={downloadWhiteboard}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm transition-colors"
              title="Download as PNG"
            >
              <FaDownload size={14} />
              Export
            </button>
            <button
              onClick={() => setShowSaveDialog(true)}
              className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors"
              title="Save whiteboard"
            >
              <FaSave size={14} />
              Save
            </button>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          className="flex-1 bg-[#1a1a1a] border border-zinc-800 rounded-lg cursor-crosshair"
        />

        {/* Text Input Overlay */}
        {addTextMode && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 max-w-md">
              <p className="text-sm mb-3">Add text to whiteboard</p>
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Enter text..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTextAdd();
                  if (e.key === "Escape") setAddTextMode(false);
                }}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded mb-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleTextAdd}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddTextMode(false)}
                  className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 max-w-md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Save Whiteboard</h3>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <FaTimes size={18} />
                </button>
              </div>
              <input
                type="text"
                value={viewTitle}
                onChange={(e) => setViewTitle(e.target.value)}
                placeholder="Board title..."
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded mb-3 text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={saveWhiteboard}
                  className="flex-1 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-sm transition-colors font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Boards Dialog */}
        {showViewBoards && (
          <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
            <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-700 max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Saved Whiteboards</h3>
                <button
                  onClick={() => setShowViewBoards(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {whiteboards.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">No saved whiteboards yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {whiteboards.map((board) => (
                    <div
                      key={board.id}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden hover:border-violet-500 transition-all group"
                    >
                      <img
                        src={board.canvas}
                        alt={board.title}
                        className="w-full h-32 object-cover cursor-pointer group-hover:opacity-75 transition-opacity"
                        onClick={() => loadWhiteboard(board)}
                      />
                      <div className="p-3">
                        <h4 className="font-semibold text-sm mb-1 truncate">{board.title}</h4>
                        <p className="text-xs text-zinc-400 mb-2">
                          {new Date(board.createdAt).toLocaleDateString()} · By {board.createdBy}
                        </p>
                        {board.notes && (
                          <p className="text-xs text-zinc-300 mb-2 line-clamp-2">{board.notes}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => loadWhiteboard(board)}
                            className="flex-1 px-2 py-1 bg-violet-600 hover:bg-violet-500 rounded text-xs transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => shareWhiteboard(board)}
                            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <FaShare size={12} />
                            Share
                          </button>
                          <button
                            onClick={() => deleteWhiteboard(board.id)}
                            className="flex-1 px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-80 flex flex-col gap-3">
        {/* Drawing Tools */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Tools</h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setMode("pen")}
              className={toolClass("pen")}
              title="Free draw"
            >
              <FaPen size={16} />
            </button>
            <button
              onClick={() => setMode("eraser")}
              className={toolClass("eraser")}
              title="Eraser"
            >
              <FaEraser size={16} />
            </button>
            <button
              onClick={() => setMode("circle")}
              className={toolClass("circle")}
              title="Circle"
            >
              <FaCircle size={16} />
            </button>
            <button
              onClick={() => setMode("square")}
              className={toolClass("square")}
              title="Rectangle"
            >
              <FaSquare size={16} />
            </button>
            <button
              onClick={() => setMode("line")}
              className={toolClass("line")}
              title="Line"
            >
              <FaLine size={16} />
            </button>
            <button
              onClick={() => setMode("text")}
              className={toolClass("text")}
              title="Add text"
            >
              <FaFont size={16} />
            </button>
            <button
              onClick={undo}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all"
              title="Undo"
            >
              <FaUndo size={16} />
            </button>
            <button
              onClick={clearCanvas}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-900 text-red-300 hover:bg-red-800 hover:text-red-100 transition-all"
              title="Clear canvas"
            >
              <FaTrash size={16} />
            </button>
          </div>
        </div>

        {/* Color Picker */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded-lg cursor-pointer"
            />
          </div>
          <div className="grid grid-cols-5 gap-1">
            {["#ffffff", "#ff6b6b", "#ffd93d", "#6bcf7f", "#4d96ff", "#c066ff", "#ff8fab"].map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-8 rounded-lg border-2 transition-all ${
                  color === c ? "border-white" : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* Brush Size */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider">
            Brush Size: {brushSize}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-violet-600"
          />
        </div>

        {/* Notes */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-2 flex-1 flex flex-col">
          <label className="text-xs font-semibold uppercase tracking-wider">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, ideas, or links..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none"
          />
          <div className="text-[10px] text-zinc-500">
            Notes are saved with this whiteboard when you save it
          </div>
        </div>
      </div>
    </div>
  );
}
