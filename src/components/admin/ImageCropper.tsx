"use client";

import { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImageFile: File, meta: { width: number, height: number, aspect_ratio: string }) => void;
  onCancel: () => void;
  aspectRatio?: number; // default 3/4
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 3 / 4 }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  
  const onCropCompleteInternal = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    rotation = 0
  ): Promise<File | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate bounding box for rotation
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(null);
        const file = new File([blob], `cropped_${Date.now()}.webp`, { type: "image/webp" });
        resolve(file);
      }, "image/webp", 0.9);
    });
  };

  const handleSave = async () => {
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      if (croppedFile) {
        onCropComplete(croppedFile, {
          width: croppedAreaPixels.width,
          height: croppedAreaPixels.height,
          aspect_ratio: aspectRatio === 3/4 ? "3:4" : "1:1"
        });
      }
    } catch (e) {
      console.error(e);
      alert("Failed to crop image.");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-white rounded-lg w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">Crop Image</h3>
          <button type="button" onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full h-[50vh] md:h-[60vh] bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspectRatio}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
          />
        </div>

        <div className="p-4 md:p-6 bg-gray-50 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold flex items-center justify-between text-gray-700">
                <span>Zoom</span>
                <span className="text-xs text-gray-500">{Math.round(zoom * 100)}%</span>
              </label>
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-black"
                />
                <ZoomIn className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold flex items-center justify-between text-gray-700">
                <span>Rotation</span>
                <span className="text-xs text-gray-500">{rotation}°</span>
              </label>
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-black"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 rounded-md font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-black text-white rounded-md font-semibold hover:bg-gray-800 transition-colors"
            >
              Apply Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
