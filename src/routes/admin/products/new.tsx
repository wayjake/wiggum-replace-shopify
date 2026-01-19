// 🆕 New Product - Birth of a soap bar
// "I'm learnding!" - Ralph on product creation
//
// ╭────────────────────────────────────────────────────────────╮
// │  This is where Karen adds new soaps to the catalog!        │
// │  Same form as edit, but starts fresh.                      │
// ╰────────────────────────────────────────────────────────────╯

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Save,
  Upload,
  X,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, products, categories } from '../../../db';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const cats = await db.select().from(categories);
  return cats;
});

const createProduct = createServerFn({ method: 'POST' }).handler(
  async (data: {
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    category?: string;
    ingredients?: string;
    imageUrl?: string;
    images?: string[];
    inStock: boolean;
    stockQuantity: number;
    lowStockThreshold: number;
    weight?: number;
    featured: boolean;
  }) => {
    const db = getDb();
    await db.insert(products).values({
      name: data.name,
      slug: data.slug,
      description: data.description,
      shortDescription: data.shortDescription,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      category: data.category,
      ingredients: data.ingredients,
      imageUrl: data.imageUrl,
      images: data.images,
      inStock: data.inStock,
      stockQuantity: data.stockQuantity,
      lowStockThreshold: data.lowStockThreshold,
      weight: data.weight,
      featured: data.featured,
    });

    return { success: true };
  }
);

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/products/new')({
  head: () => ({
    meta: [
      { title: "Add Product | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Add a new product to your catalog.' },
    ],
  }),
  loader: async () => {
    const [authResult, cats] = await Promise.all([
      requireAdmin(),
      getCategories(),
    ]);
    return { authResult, categories: cats };
  },
  component: NewProduct,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function NewProduct() {
  const navigate = useNavigate();
  const { authResult, categories: cats } = Route.useLoaderData();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: '',
    compareAtPrice: '',
    category: '',
    ingredients: '',
    imageUrl: '',
    images: [] as string[],
    inStock: true,
    stockQuantity: '10',
    lowStockThreshold: '10',
    weight: '',
    featured: false,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [imageUploadMode, setImageUploadMode] = useState<'file' | 'url'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth guard redirect
  useEffect(() => {
    if (!authResult.authenticated || !authResult.isAdmin) {
      navigate({ to: authResult.redirect || '/login' });
    }
  }, [authResult, navigate]);

  if (!authResult.authenticated || !authResult.isAdmin) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D5A4A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-generate slug when name changes
    if (name === 'name') {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }
  };

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;

    const file = files[0];
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Convert to base64 data URI
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      setFormData((prev) => ({
        ...prev,
        imageUrl: dataUri,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle URL input
  const handleUrlSubmit = () => {
    if (imageUrlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        imageUrl: imageUrlInput.trim(),
      }));
      setImageUrlInput('');
    }
  };

  // Add gallery image
  const addGalleryImage = (url: string) => {
    if (!url.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, url.trim()],
    }));
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  // Save product
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    setIsSaving(true);
    try {
      await createProduct({
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        category: formData.category || undefined,
        ingredients: formData.ingredients || undefined,
        imageUrl: formData.imageUrl || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        inStock: formData.inStock,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        featured: formData.featured,
      });
      navigate({ to: '/admin/products' });
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to create product');
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      {/* Admin Header */}
      <header className="bg-white border-b border-[#F5EBE0]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2D5A4A] rounded-full flex items-center justify-center">
                  <span className="text-xl">🧼</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-[#1A1A1A] font-display">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">Karen's Beautiful Soap</p>
                </div>
              </Link>
            </div>
            <nav className="flex items-center gap-6">
              <Link to="/admin" className="text-gray-600 hover:text-[#2D5A4A]">Dashboard</Link>
              <Link to="/admin/products" className="text-[#2D5A4A] font-medium">Products</Link>
              <Link to="/admin/orders" className="text-gray-600 hover:text-[#2D5A4A]">Orders</Link>
              <Link to="/admin/customers" className="text-gray-600 hover:text-[#2D5A4A]">Customers</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back & Save */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/admin/products"
            className="flex items-center gap-2 text-gray-600 hover:text-[#2D5A4A]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Products
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-[#2D5A4A] text-white px-4 py-2 rounded-lg hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Creating...' : 'Create Product'}
          </button>
        </div>

        <h2 className="text-2xl font-bold text-[#1A1A1A] font-display mb-6">Add New Product</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Lavender Dreams"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">/shop/</span>
                    <input
                      type="text"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      placeholder="lavender-dreams"
                      className="flex-1 px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Auto-generated from name</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Short Description
                  </label>
                  <input
                    type="text"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="A brief tagline for product cards"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Describe your soap in detail..."
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingredients
                  </label>
                  <textarea
                    name="ingredients"
                    value={formData.ingredients}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Olive oil, coconut oil, shea butter, lavender essential oil..."
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Product Images</h3>

              {/* Main Image */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Image
                </label>
                <div className="flex gap-4">
                  {/* Image Preview */}
                  <div
                    className={cn(
                      'w-40 h-40 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden',
                      isDragging ? 'border-[#2D5A4A] bg-[#2D5A4A]/5' : 'border-[#F5EBE0]'
                    )}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    {formData.imageUrl ? (
                      <div className="relative w-full h-full group">
                        <img
                          src={formData.imageUrl}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center p-4">
                        <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs text-gray-400">Drag & drop</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Options */}
                  <div className="flex-1">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => setImageUploadMode('url')}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          imageUploadMode === 'url'
                            ? 'bg-[#2D5A4A] text-white'
                            : 'bg-[#F5EBE0] text-gray-600 hover:bg-[#F5EBE0]/70'
                        )}
                      >
                        <LinkIcon className="w-4 h-4" />
                        URL
                      </button>
                      <button
                        onClick={() => setImageUploadMode('file')}
                        className={cn(
                          'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                          imageUploadMode === 'file'
                            ? 'bg-[#2D5A4A] text-white'
                            : 'bg-[#F5EBE0] text-gray-600 hover:bg-[#F5EBE0]/70'
                        )}
                      >
                        <Upload className="w-4 h-4" />
                        Upload
                      </button>
                    </div>

                    {imageUploadMode === 'url' ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          placeholder="https://images.unsplash.com/..."
                          className="flex-1 px-3 py-2 rounded-lg border border-[#F5EBE0] text-sm focus:outline-none focus:border-[#2D5A4A]"
                          onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        />
                        <button
                          onClick={handleUrlSubmit}
                          className="px-3 py-2 bg-[#2D5A4A] text-white rounded-lg text-sm hover:bg-[#1A1A1A]"
                        >
                          Set
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e.target.files)}
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full px-3 py-2 border border-dashed border-[#F5EBE0] rounded-lg text-sm text-gray-600 hover:border-[#2D5A4A] hover:text-[#2D5A4A] transition-colors"
                        >
                          Choose file or drag & drop
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Recommended: 800x800px, max 2MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Gallery Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Images (optional)
                </label>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  {formData.images.map((img, i) => (
                    <div key={i} className="relative group aspect-square">
                      <img
                        src={img}
                        alt={`Gallery ${i + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const url = prompt('Enter image URL:');
                      if (url) addGalleryImage(url);
                    }}
                    className="aspect-square border-2 border-dashed border-[#F5EBE0] rounded-lg flex flex-col items-center justify-center hover:border-[#2D5A4A] transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Add</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Pricing</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="12.00"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compare at Price ($)
                  </label>
                  <input
                    type="number"
                    name="compareAtPrice"
                    value={formData.compareAtPrice}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="Optional sale price"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
              </div>
            </section>

            {/* Inventory */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Inventory</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Alert when stock drops below this
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="inStock"
                    checked={formData.inStock}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#2D5A4A] focus:ring-[#2D5A4A]"
                  />
                  <span className="text-sm text-gray-700">In Stock</span>
                </label>
              </div>
            </section>

            {/* Organization */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Organization</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  >
                    <option value="">Select category</option>
                    {cats.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                    <option value="Relaxation">Relaxation</option>
                    <option value="Exfoliating">Exfoliating</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Energizing">Energizing</option>
                    <option value="Moisturizing">Moisturizing</option>
                    <option value="Fresh">Fresh</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (oz)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    step="0.1"
                    min="0"
                    placeholder="4.5"
                    className="w-full px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-[#2D5A4A] focus:ring-[#2D5A4A]"
                  />
                  <span className="text-sm text-gray-700">Featured Product</span>
                </label>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
