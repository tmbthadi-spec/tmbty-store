"use client";
import { useState } from "react";

export default function ProductMediaGallery({ title, images = [], videoUrl = "" }) {
  const cleanImages = Array.isArray(images) ? images.filter(Boolean) : [];
  const [active, setActive] = useState({ type: "image", value: cleanImages[0] || "" });

  return <div className="productMedia">
    <div className="mediaStage">
      {active.type === "video" && videoUrl
        ? <video className="mediaMain" controls autoPlay playsInline poster={cleanImages[0] || undefined} src={videoUrl} />
        : active.value
          ? <img className="mediaMain" src={active.value} alt={title} />
          : <div className="mediaEmpty">TMBTY</div>}
    </div>

    <div className="mediaThumbs">
      {videoUrl ? <button
        type="button"
        className={"mediaThumb videoThumb" + (active.type === "video" ? " active" : "")}
        onClick={() => setActive({ type: "video", value: videoUrl })}
        aria-label="Play product video"
      >
        {cleanImages[0] ? <img src={cleanImages[0]} alt="" /> : null}
        <span className="playBadge">▶</span>
        <span className="videoLabel">Video</span>
      </button> : null}

      {cleanImages.slice(0, 8).map((u, i) => <button
        type="button"
        className={"mediaThumb" + (active.type === "image" && active.value === u ? " active" : "")}
        onClick={() => setActive({ type: "image", value: u })}
        key={u + i}
        aria-label={i === 0 ? "View original product cover" : `View ${title} image ${i + 1}`}
      >
        <img src={u} alt={i === 0 ? `${title} original cover` : `${title} view ${i + 1}`} />
      </button>)}
    </div>
  </div>;
}
