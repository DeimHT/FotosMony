"use client";

import { useState } from "react";

export default function UploadFotoPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      console.log("Subida OK:", data);
      alert("Foto subida");
    } else {
      alert(data.error);
    }
  };

  return (
    <div>
      <h1>Subir foto</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Subiendo..." : "Subir"}
      </button>
    </div>
  );
}
