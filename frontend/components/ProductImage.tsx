"use client";

import { useState, useEffect } from "react";

// Simple grey placeholder with 'IMG' text (Base64 PNG)
const FALLBACK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAE0lEQVR4nGP8/98/AAEB/0AAAQAA/wD/AAAB";

export function ProductImage({ 
    src, 
    alt, 
    className 
}: { 
    src?: string; 
    alt: string; 
    className?: string; 
}) {
    const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

    useEffect(() => {
        setImgSrc(src || FALLBACK_IMAGE);
    }, [src]);

    return (
        <img 
            src={imgSrc} 
            alt={alt} 
            className={`${className} bg-slate-100`}
            onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
    );
}