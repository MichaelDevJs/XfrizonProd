import { FaTimes } from "react-icons/fa";

const ScannerModal = ({
  isOpen,
  videoRef,
  canvasRef,
  scanResult,
  onCapture,
  onValidate,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-light text-gray-200">
            Scan Ticket QR Code
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover"
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {scanResult && (
            <div className="p-4 bg-indigo-500/10 border border-indigo-500 rounded-lg">
              <p className="text-indigo-400 font-light text-sm">
                Scanned: <span className="font-mono">{scanResult}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onCapture}
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-light text-sm transition-all duration-300"
            >
              {scanResult ? "Scan Again" : "Capture"}
            </button>
            {scanResult && (
              <button
                onClick={onValidate}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-light text-sm transition-all duration-300"
              >
                Validate
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 rounded-lg font-light text-sm transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScannerModal;
