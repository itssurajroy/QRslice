"use client";

import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";

export function MenuOcrModal({ onClose, onSave }: { onClose: () => void, onSave: (items: any[]) => void }) {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedItems, setExtractedItems] = useState<{name: string, price: number}[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setExtractedItems([]);
      setIsEditing(false);
    }
  };

  const handleScan = async () => {
    if (!image) return;
    setIsScanning(true);
    setProgress(0);
    
    try {
      const { data } = await Tesseract.recognize(
        image,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      const lines = data.text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const parsedItems: {name: string, price: number}[] = [];
      
      // Simple regex to find "Item Name 150" or "Item Name - 150" or "Item Name ₹150"
      const itemRegex = /^(.+?)(?:[\s\-₹Rs]+)([\d.,]+)$/i;
      
      for (const line of lines) {
        const match = line.match(itemRegex);
        if (match) {
          const name = match[1].trim().replace(/[^a-zA-Z0-9\s]/g, '');
          const priceStr = match[2].replace(/,/g, '');
          const price = parseFloat(priceStr);
          if (name.length > 2 && !isNaN(price)) {
            parsedItems.push({ name, price });
          }
        } else {
          // If no price found, maybe it's just a category or item name without price
          // We can add it with 0 price for manual adjustment
          const cleanName = line.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          if (cleanName.length > 3) {
            parsedItems.push({ name: cleanName, price: 0 });
          }
        }
      }
      
      setExtractedItems(parsedItems);
      setIsEditing(true);
    } catch (err) {
      console.error(err);
      alert("Failed to scan image.");
    } finally {
      setIsScanning(false);
    }
  };

  const updateItem = (index: number, field: 'name'|'price', value: string) => {
    const newItems = [...extractedItems];
    if (field === 'price') {
      newItems[index].price = parseFloat(value) || 0;
    } else {
      newItems[index].name = value;
    }
    setExtractedItems(newItems);
  };
  
  const removeItem = (index: number) => {
    const newItems = [...extractedItems];
    newItems.splice(index, 1);
    setExtractedItems(newItems);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">📸 Scan Physical Menu (Local OCR)</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {!isEditing ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-full max-w-md border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-4xl mb-2">📷</div>
                <p className="text-sm font-bold text-slate-700">Click to upload menu picture</p>
                <p className="text-xs text-slate-500 mt-1">JPEG, PNG only. High contrast works best.</p>
              </div>
              
              {previewUrl && (
                <div className="mt-4 flex flex-col items-center">
                  <img src={previewUrl} alt="Menu Preview" className="max-h-64 rounded-lg shadow-md border border-slate-200" />
                  <button 
                    onClick={handleScan}
                    disabled={isScanning}
                    className="mt-4 px-6 py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all"
                  >
                    {isScanning ? `Scanning... ${progress}%` : 'Extract Text (No AI)'}
                  </button>
                  <p className="text-xs text-slate-500 mt-2">Processing happens 100% locally in your browser.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 mb-2">Review and adjust the extracted items below. Typos are common with OCR.</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
                  {extractedItems.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-center bg-white p-2 rounded border border-slate-200">
                      <input 
                        type="text" 
                        value={item.name} 
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        className="flex-1 text-sm p-1.5 border border-slate-200 rounded"
                        placeholder="Item Name"
                      />
                      <input 
                        type="number" 
                        value={item.price || ''} 
                        onChange={(e) => updateItem(idx, 'price', e.target.value)}
                        className="w-24 text-sm p-1.5 border border-slate-200 rounded"
                        placeholder="Price"
                      />
                      <button onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 px-2 font-bold">×</button>
                    </div>
                  ))}
                  {extractedItems.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No items detected. The image might be too blurry.</p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
                >
                  Rescan Image
                </button>
                <button 
                  onClick={() => onSave(extractedItems)}
                  disabled={extractedItems.length === 0}
                  className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  Save {extractedItems.length} Items to Menu
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
