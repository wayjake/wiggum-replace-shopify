// 📝 Product Editor - Where soap dreams become reality
// "Me fail English? That's unpossible!" - Ralph on form validation
//
// ╭────────────────────────────────────────────────────────────╮
// │  🖼️  IMAGE UPLOAD OPTIONS:                                  │
// │  • Drag & drop image files                                 │
// │  • Paste URL from Unsplash, etc.                          │
// │  • Images stored as data URIs for simplicity              │
// │  (In production, you'd want S3, Cloudinary, etc.)         │
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
  Trash2,
  GripVertical,
  Plus,
  Loader2,
} from 'lucide-react';
import { cn } from '../../../utils';
import { requireAdmin } from '../../../lib/auth-guards';
import { getDb, products, categories } from '../../../db';
import { eq } from 'drizzle-orm';
import { sendEvent } from '../../../lib/inngest';

// ═══════════════════════════════════════════════════════════
// SERVER FUNCTIONS
// ═══════════════════════════════════════════════════════════

const getProduct = createServerFn({ method: 'GET' }).handler(
  async (productId: string) => {
    const db = getDb();
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });
    return product || null;
  }
);

const getCategories = createServerFn({ method: 'GET' }).handler(async () => {
  const db = getDb();
  const cats = await db.select().from(categories);
  return cats;
});

const updateProduct = createServerFn({ method: 'POST' }).handler(
  async (data: {
    id: string;
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
    await db
      .update(products)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(products.id, data.id));

    // 🚨 Trigger low stock alert if stock is below threshold
    if (data.stockQuantity < data.lowStockThreshold) {
      try {
        await sendEvent('shop/admin.low-stock-alert', {
          productId: data.id,
          productName: data.name,
          currentStock: data.stockQuantity,
          threshold: data.lowStockThreshold,
        });
      } catch (error) {
        // Don't fail the update if Inngest fails
        console.error('Failed to send low stock alert:', error);
      }
    }

    return { success: true };
  }
);

// ═══════════════════════════════════════════════════════════
// ROUTE DEFINITION
// ═══════════════════════════════════════════════════════════

export const Route = createFileRoute('/admin/products/$productId')({
  head: () => ({
    meta: [
      { title: "Edit Product | Admin | Karen's Beautiful Soap" },
      { name: 'description', content: 'Edit product details and images.' },
    ],
  }),
  loader: async ({ params }) => {
    const [authResult, product, cats] = await Promise.all([
      requireAdmin(),
      getProduct(params.productId),
      getCategories(),
    ]);
    return { authResult, product, categories: cats };
  },
  component: EditProduct,
});

// ═══════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════

function EditProduct() {
  const navigate = useNavigate();
  const { authResult, product, categories: cats } = Route.useLoaderData();
  const { productId } = Route.useParams();

  // Form state
  const [formData, setFormData] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    shortDescription: product?.shortDescription || '',
    price: product?.price?.toString() || '',
    compareAtPrice: product?.compareAtPrice?.toString() || '',
    category: product?.category || '',
    ingredients: product?.ingredients || '',
    imageUrl: product?.imageUrl || '',
    images: product?.images || [],
    inStock: product?.inStock ?? true,
    stockQuantity: product?.stockQuantity?.toString() || '0',
    lowStockThreshold: product?.lowStockThreshold?.toString() || '10',
    weight: product?.weight?.toString() || '',
    featured: product?.featured ?? false,
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

  if (!product) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">Product not found</h2>
          <Link to="/admin/products" className="text-[#2D5A4A] hover:underline">
            Back to products
          </Link>
        </div>
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
      images: [...(prev.images || []), url.trim()],
    }));
  };

  // Remove gallery image
  const removeGalleryImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
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
    setIsSaving(true);
    try {
      await updateProduct({
        id: productId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description || undefined,
        shortDescription: formData.shortDescription || undefined,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
        category: formData.category || undefined,
        ingredients: formData.ingredients || undefined,
        imageUrl: formData.imageUrl || undefined,
        images: formData.images || undefined,
        inStock: formData.inStock,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        featured: formData.featured,
      });
      navigate({ to: '/admin/products' });
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save product');
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <section className="bg-white rounded-xl border border-[#F5EBE0] p-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
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
                      className="flex-1 px-4 py-2 rounded-lg border border-[#F5EBE0] focus:outline-none focus:border-[#2D5A4A]"
                    />
                  </div>
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
                    placeholder="List of ingredients"
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
              <GalleryManager
                images={formData.images || []}
                onImagesChange={(images) => setFormData((prev) => ({ ...prev, images }))}
              />
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
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
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

// ═══════════════════════════════════════════════════════════
// GALLERY MANAGER
// 🖼️ Manage multiple product images with drag-and-drop reordering
// ═══════════════════════════════════════════════════════════

function GalleryManager({
  images,
  onImagesChange,
}: {
  images: string[];
  onImagesChange: (images: string[]) => void;
}) {
  const [urlInput, setUrlInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);

  // Add image from URL
  const addImageFromUrl = () => {
    if (urlInput.trim()) {
      onImagesChange([...images, urlInput.trim()]);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  // Add image from file
  const handleFileSelect = async (files: FileList | null) => {
    if (!files?.length) return;

    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      // Convert to base64
      const dataUri = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newImages.push(dataUri);
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  // Move image to a new position
  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [moved] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, moved);
    onImagesChange(newImages);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveImage(draggedIndex, index);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Set as main image (move to position 0)
  const setAsMainImage = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Gallery Images ({images.length})
        </label>
        <p className="text-xs text-gray-400">Drag to reorder</p>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {images.map((img, index) => (
          <div
            key={`${img}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={cn(
              'relative group aspect-square cursor-move rounded-lg overflow-hidden border-2 transition-all',
              draggedIndex === index
                ? 'border-[#2D5A4A] opacity-50'
                : 'border-transparent hover:border-[#D4A574]',
              index === 0 && 'ring-2 ring-[#2D5A4A] ring-offset-2'
            )}
          >
            <img
              src={img}
              alt={`Gallery ${index + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Overlay with actions */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
              {index !== 0 && (
                <button
                  onClick={() => setAsMainImage(index)}
                  className="p-1.5 bg-white text-[#1A1A1A] rounded text-xs font-medium hover:bg-[#F5EBE0]"
                  title="Set as main image"
                >
                  Main
                </button>
              )}
              <button
                onClick={() => removeImage(index)}
                className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                title="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Drag handle indicator */}
            <div className="absolute top-1 left-1 p-0.5 bg-white/80 rounded opacity-0 group-hover:opacity-100">
              <GripVertical className="w-3 h-3 text-gray-500" />
            </div>

            {/* Main badge */}
            {index === 0 && (
              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[#2D5A4A] text-white text-xs rounded">
                Main
              </div>
            )}
          </div>
        ))}

        {/* Add Button */}
        <div className="aspect-square border-2 border-dashed border-[#F5EBE0] rounded-lg flex flex-col items-center justify-center hover:border-[#2D5A4A] transition-colors">
          <input
            ref={galleryFileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <div className="text-center">
            <div className="flex justify-center gap-2 mb-1">
              <button
                onClick={() => galleryFileInputRef.current?.click()}
                className="p-1.5 bg-[#F5EBE0] rounded hover:bg-[#D4A574] transition-colors"
                title="Upload files"
              >
                <Upload className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={cn(
                  'p-1.5 rounded transition-colors',
                  showUrlInput ? 'bg-[#2D5A4A] text-white' : 'bg-[#F5EBE0] hover:bg-[#D4A574]'
                )}
                title="Add from URL"
              >
                <LinkIcon className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-400">Add images</span>
          </div>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            className="flex-1 px-3 py-2 rounded-lg border border-[#F5EBE0] text-sm focus:outline-none focus:border-[#2D5A4A]"
            onKeyDown={(e) => e.key === 'Enter' && addImageFromUrl()}
          />
          <button
            onClick={addImageFromUrl}
            className="px-3 py-2 bg-[#2D5A4A] text-white rounded-lg text-sm hover:bg-[#1A1A1A]"
          >
            Add
          </button>
          <button
            onClick={() => setShowUrlInput(false)}
            className="px-3 py-2 border border-[#F5EBE0] rounded-lg text-sm text-gray-600 hover:bg-[#F5EBE0]"
          >
            Cancel
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-2">
        The first image will be used as the main product image. Drag to reorder.
      </p>
    </div>
  );
}
