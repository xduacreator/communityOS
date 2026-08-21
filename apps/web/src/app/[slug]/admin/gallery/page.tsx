'use client';
import { getApiUrl } from '../../../../lib/api';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthHeaders } from '../../../../lib/auth';
import imageCompression from 'browser-image-compression';
import { Image as ImageIcon, Plus, Trash2, Link as LinkIcon, Type, X } from 'lucide-react';
import ConfirmModal from '../../../../components/ui/ConfirmModal';

import { GalleryImage, Community } from '../../../../types';

export default function AdminGallery({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = React.use(params);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteData, setDeleteData] = useState<{ id: string, url: string } | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({ url: '', caption: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const commRes = await fetch(`${getApiUrl()}/communities/${resolvedParams.slug}`);
      if (!commRes.ok) throw new Error('Community not found');
      const commData = await commRes.json();
      setCommunity(commData);

      const galleryRes = await fetch(`${getApiUrl()}/gallery/community/${commData.id}`);
      if (!galleryRes.ok) throw new Error('Failed to fetch gallery images');
      const galleryData = await galleryRes.json();
      setImages(galleryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [resolvedParams.slug]);

  const uploadFile = async (file: File) => {
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    const compressedFile = await imageCompression(file, options);
    const formData = new FormData();
    formData.append('file', compressedFile);
    const res = await fetch(getApiUrl() + '/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    const data = await res.json();
    return data.url;
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please select an image to upload.');
      return;
    }
    if (!community) {
      alert('Community data not loaded yet.');
      return;
    }
    setSaving(true);
    try {
      const uploadedUrl = await uploadFile(imageFile);
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/gallery/community/${community.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ url: uploadedUrl, caption: formData.caption }),
      });

      if (!res.ok) throw new Error('Failed to add image');
      
      setFormData({ url: '', caption: '' });
      setImageFile(null);
      setAddModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, url: string) => {
    setDeleteData({ id, url });
    setDeleteModalOpen(true);
  };

  const handleDeleteImage = async () => {
    if (!deleteData) return;
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${getApiUrl()}/gallery/${deleteData.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) throw new Error('Failed to delete image');
      setDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-12 h-12 bg-indigo-200 rounded-full mb-4 flex items-center justify-center">
          <ImageIcon className="w-6 h-6 text-indigo-500" />
        </div>
        <div className="text-slate-400 font-medium tracking-wide">Loading Gallery...</div>
      </div>
    </div>
  );

  if (error) return <div className="p-8 text-center text-red-500 bg-red-50 m-8 rounded-2xl">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Photo Gallery</h1>
          <p className="mt-2 text-slate-500">Manage photos for {community?.name}</p>
        </div>
        <button 
          onClick={() => setAddModalOpen(true)}
          className="flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Photo
        </button>
      </div>

      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {images.map((image) => (
          <div key={image.id} className="break-inside-avoid relative group rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-200">
            <img 
              src={image.url} 
              alt={image.caption || 'Gallery Image'} 
              className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400'; }}
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <button 
                onClick={() => confirmDelete(image.id, image.url)}
                className="absolute top-4 right-4 p-2.5 bg-white/20 hover:bg-red-500 text-white backdrop-blur-md rounded-xl transition-all"
                title="Delete Photo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {image.caption && (
                <p className="text-white font-medium text-sm leading-tight">{image.caption}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {images.length === 0 && (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No photos yet</h3>
          <p className="text-slate-500 mt-1 mb-6">Add some photos to showcase your community activities.</p>
          <button 
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center justify-center px-6 py-3 bg-indigo-50 text-indigo-700 font-bold rounded-2xl hover:bg-indigo-100 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Add First Photo
          </button>
        </div>
      )}

      {/* Add Image Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Add Photo</h2>
                <p className="text-sm text-slate-500 mt-1">Provide an image URL to add to gallery</p>
              </div>
              <button onClick={() => setAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddImage} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2 text-slate-400" /> Image Upload
                </label>
                {imageFile && (
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Preview" 
                    className="w-full h-48 object-cover rounded-xl mb-4 border border-slate-200"
                  />
                )}
                <input 
                  required type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Type className="w-4 h-4 mr-2 text-slate-400" /> Caption (Optional)
                </label>
                <textarea 
                  rows={3}
                  value={formData.caption} onChange={e => setFormData({...formData, caption: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-shadow font-medium resize-none" 
                  placeholder="Describe this photo..."
                />
              </div>
              
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={() => setAddModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl mr-3 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50">
                  {saving ? 'Adding...' : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        title="Delete Photo"
        message="Are you sure you want to remove this photo from the gallery? This action cannot be undone."
        confirmText="Delete Photo"
        isDestructive={true}
        onConfirm={handleDeleteImage}
        onCancel={() => setDeleteModalOpen(false)}
      />
    </div>
  );
}
