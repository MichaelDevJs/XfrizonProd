import React, { useRef } from "react";
import { toast } from "react-toastify";

export default function AudioManager({ formData, setFormData }) {
  const fileInputRef = useRef(null);

  const handleAudioUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          audioTracks: [
            ...prev.audioTracks,
            {
              id: Date.now() + Math.random(),
              src: reader.result,
              name: file.name,
              size: (file.size / (1024 * 1024)).toFixed(2),
              uploadedAt: new Date().toLocaleString(),
              type: "local",
              genre: "Music",
            },
          ],
        }));
        toast.success(`Audio "${file.name}" uploaded`);
      };
      reader.readAsDataURL(file);
    });
  };

  const addSoundCloudTrack = () => {
    const url = prompt("Enter SoundCloud track URL or embed code:");
    const title = prompt("Enter track title:");
    if (url && title) {
      setFormData((prev) => ({
        ...prev,
        audioTracks: [
          ...prev.audioTracks,
          {
            id: Date.now() + Math.random(),
            name: title,
            url,
            type: "soundcloud",
            uploadedAt: new Date().toLocaleString(),
          },
        ],
      }));
      toast.success("SoundCloud track added");
    }
  };

  const addSpotifyTrack = () => {
    const url = prompt("Enter Spotify track/playlist URL:");
    const title = prompt("Enter track/playlist title:");
    if (url && title) {
      setFormData((prev) => ({
        ...prev,
        audioTracks: [
          ...prev.audioTracks,
          {
            id: Date.now() + Math.random(),
            name: title,
            url,
            type: "spotify",
            uploadedAt: new Date().toLocaleString(),
          },
        ],
      }));
      toast.success("Spotify track added");
    }
  };

  const addDJMix = () => {
    const title = prompt("Enter DJ mix name:");
    const artist = prompt("Enter DJ name:");
    const duration = prompt("Enter duration (e.g., 45:30):");
    if (title && artist) {
      setFormData((prev) => ({
        ...prev,
        audioTracks: [
          ...prev.audioTracks,
          {
            id: Date.now() + Math.random(),
            name: title,
            artist,
            duration,
            type: "djmix",
            uploadedAt: new Date().toLocaleString(),
            genre: "DJ Mix",
          },
        ],
      }));
      toast.success("DJ mix added");
    }
  };

  const removeAudio = (id) => {
    setFormData((prev) => ({
      ...prev,
      audioTracks: prev.audioTracks.filter((track) => track.id !== id),
    }));
    toast.info("Audio removed");
  };

  const getTypeIcon = (type) => {
    const icons = {
      local: "🎵",
      soundcloud: "☁️",
      spotify: "🎧",
      djmix: "🎚️",
    };
    return icons[type] || "🎵";
  };

  return (
    <div className="space-y-4">
      {/* Audio Types Navigation */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-semibold"
        >
          🎵 Upload Audio
        </button>
        <button
          onClick={addSoundCloudTrack}
          className="px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-semibold"
        >
          ☁️ SoundCloud
        </button>
        <button
          onClick={addSpotifyTrack}
          className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold"
        >
          🎧 Spotify
        </button>
        <button
          onClick={addDJMix}
          className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm font-semibold"
        >
          🎚️ DJ Mix
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={handleAudioUpload}
        className="hidden"
      />

      {/* Audio Tracks List */}
      {formData.audioTracks.length > 0 && (
        <div className="space-y-2">
          {formData.audioTracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getTypeIcon(track.type)}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      {track.name}
                    </p>
                    <p className="text-xs text-gray-600">
                      {track.artist ? `${track.artist} • ` : ""}
                      {track.size ? `${track.size}MB • ` : ""}
                      {track.duration ? `${track.duration} • ` : ""}
                      {track.uploadedAt}
                    </p>
                    {track.url && (
                      <p className="text-xs text-blue-600 truncate">
                        {track.url}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeAudio(track.id)}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {formData.audioTracks.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No audio tracks added yet
        </p>
      )}

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
        <p className="text-xs text-purple-900">
          💡 <strong>Supported:</strong> MP3, WAV, FLAC (Local) | SoundCloud |
          Spotify | DJ Mixes
        </p>
      </div>
    </div>
  );
}
