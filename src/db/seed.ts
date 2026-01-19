// 🌱 Database Seeding Script - Planting the seeds of our soap garden
// "I'm helping!" - Ralph, populating the database
//
// Run this script to populate the database with:
// - Sample categories
// - Karen's Beautiful Soap products
// - A test admin user
//
// Usage: npx tsx src/db/seed.ts

import { getDb, products, categories, users } from './index';
import { hashPassword } from '../lib/auth';

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  CATEGORIES                                              │
 * │  ─────────────────────────────────────────────────────── │
 * │  The soap kingdoms of our store.                         │
 * ╰─────────────────────────────────────────────────────────╯
 */
const CATEGORIES = [
  {
    name: 'Relaxation',
    slug: 'relaxation',
    description: 'Unwind and destress with our calming soap collection',
    sortOrder: 1,
  },
  {
    name: 'Exfoliating',
    slug: 'exfoliating',
    description: 'Gentle scrubs for smooth, renewed skin',
    sortOrder: 2,
  },
  {
    name: 'Luxury',
    slug: 'luxury',
    description: 'Premium ingredients for the most discerning bathers',
    sortOrder: 3,
  },
  {
    name: 'Energizing',
    slug: 'energizing',
    description: 'Wake up your senses with invigorating scents',
    sortOrder: 4,
  },
  {
    name: 'Moisturizing',
    slug: 'moisturizing',
    description: 'Deep hydration for silky smooth skin',
    sortOrder: 5,
  },
  {
    name: 'Fresh',
    slug: 'fresh',
    description: 'Clean, crisp scents inspired by nature',
    sortOrder: 6,
  },
];

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  PRODUCTS                                                │
 * │  ─────────────────────────────────────────────────────── │
 * │  Every bar of beautiful soap Karen has lovingly crafted. │
 * │  🧼 These match the product catalog in wiggum/PROMPT.md  │
 * ╰─────────────────────────────────────────────────────────╯
 */
const PRODUCTS = [
  {
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    shortDescription: 'Drift off with the soothing scent of French lavender',
    description: `Experience tranquility in every wash with our signature Lavender Dreams bar.

Handcrafted with organic French lavender essential oil, this soap creates a spa-like atmosphere in your own bathroom. Perfect for evening baths when you want to unwind and prepare for a restful night's sleep.

🌿 **Key Benefits:**
- Calming aromatherapy
- Gentle on sensitive skin
- Long-lasting fragrance
- Moisturizing shea butter base`,
    price: 12.0,
    category: 'Relaxation',
    ingredients: 'Olive oil, coconut oil, shea butter, French lavender essential oil, dried lavender buds',
    imageUrl: 'https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 50,
    featured: true,
    weight: 4.5,
    sortOrder: 1,
  },
  {
    name: 'Honey Oat Comfort',
    slug: 'honey-oat-comfort',
    shortDescription: "Nature's gentlest exfoliation",
    description: `Indulge your skin with the natural goodness of raw honey and organic oatmeal.

This gentle exfoliating bar removes dead skin cells while nourishing with honey's natural humectant properties. Perfect for those seeking smooth, glowing skin without harsh chemicals.

🍯 **Key Benefits:**
- Gentle natural exfoliation
- Deep moisturizing
- Soothes irritated skin
- Sweet, comforting scent`,
    price: 14.0,
    category: 'Exfoliating',
    ingredients: 'Oatmeal, raw honey, coconut oil, shea butter, vitamin E, oat milk',
    imageUrl: 'https://images.unsplash.com/photo-1607006344380-b6775a0824a7?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 35,
    featured: true,
    weight: 5.0,
    sortOrder: 2,
  },
  {
    name: 'Rose Petal Luxury',
    slug: 'rose-petal-luxury',
    shortDescription: 'Feel like royalty with every wash',
    description: `Treat yourself to the ultimate bathing experience with our Rose Petal Luxury bar.

Infused with real rose petals and precious rosehip oil, this decadent soap leaves your skin feeling pampered and smelling divine. A true luxury that makes every day special.

🌹 **Key Benefits:**
- Anti-aging rosehip oil
- Real rose petals
- Romantic fragrance
- Vitamin E enriched`,
    price: 16.0,
    compareAtPrice: 18.0,
    category: 'Luxury',
    ingredients: 'Rose petals, rosehip oil, vitamin E, shea butter, rose absolute, goat milk',
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 25,
    featured: true,
    weight: 4.0,
    sortOrder: 3,
  },
  {
    name: 'Citrus Burst',
    slug: 'citrus-burst',
    shortDescription: 'Wake up your senses',
    description: `Start your day with an invigorating burst of citrus freshness!

Our Citrus Burst bar combines the zesty goodness of orange, lemon, and grapefruit to create an energizing shower experience that will have you ready to conquer the day.

🍊 **Key Benefits:**
- Energizing aromatherapy
- Brightening vitamin C
- Uplifting scent
- Natural astringent properties`,
    price: 11.0,
    category: 'Energizing',
    ingredients: 'Orange zest, lemon essential oil, grapefruit extract, olive oil, coconut oil',
    imageUrl: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 45,
    featured: false,
    weight: 4.0,
    sortOrder: 4,
  },
  {
    name: 'Coconut Milk Bliss',
    slug: 'coconut-milk-bliss',
    shortDescription: 'Tropical hydration in a bar',
    description: `Transport yourself to paradise with every shower!

Our Coconut Milk Bliss bar is packed with the nourishing goodness of real coconut milk and virgin coconut oil. A touch of vanilla adds warmth to this tropical delight that leaves your skin feeling incredibly soft and hydrated.

🥥 **Key Benefits:**
- Deep hydration
- Tropical aromatherapy
- Rich, creamy lather
- Skin-softening formula`,
    price: 13.0,
    category: 'Moisturizing',
    ingredients: 'Coconut milk, virgin coconut oil, vanilla extract, shea butter, vitamin E',
    imageUrl: 'https://images.unsplash.com/photo-1584305574647-0cc949a2bb9f?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 40,
    featured: false,
    weight: 4.5,
    sortOrder: 5,
  },
  {
    name: 'Forest Pine Freshness',
    slug: 'forest-pine-freshness',
    shortDescription: 'Bring the outdoors in',
    description: `Escape to a misty forest with our invigorating Forest Pine Freshness bar.

Combining the crisp, clean scents of pine needles, cedarwood, and eucalyptus, this soap is perfect for nature lovers who want to bring the refreshing essence of the great outdoors into their daily routine.

🌲 **Key Benefits:**
- Crisp, clean scent
- Eucalyptus aromatherapy
- Clarifying properties
- Masculine yet unisex appeal`,
    price: 12.0,
    category: 'Fresh',
    ingredients: 'Pine needle extract, cedarwood oil, eucalyptus essential oil, olive oil, charcoal',
    imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 30,
    featured: false,
    weight: 4.5,
    sortOrder: 6,
  },
  {
    name: 'Charcoal Detox',
    slug: 'charcoal-detox',
    shortDescription: 'Deep cleansing for urban warriors',
    description: `Give your skin the deep clean it deserves with activated charcoal.

Our Charcoal Detox bar draws out impurities and toxins while tea tree oil provides natural antibacterial benefits. Perfect for oily skin or anyone looking for a thorough cleanse after a long day.

⚫ **Key Benefits:**
- Deep pore cleansing
- Draws out impurities
- Tea tree antibacterial
- Balances oily skin`,
    price: 13.0,
    category: 'Fresh',
    ingredients: 'Activated charcoal, tea tree oil, coconut oil, kaolin clay, peppermint',
    imageUrl: 'https://images.unsplash.com/photo-1612817159949-195b6eb9e31a?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 35,
    featured: false,
    weight: 4.0,
    sortOrder: 7,
  },
  {
    name: 'Chamomile Calm',
    slug: 'chamomile-calm',
    shortDescription: 'Gentle care for sensitive souls',
    description: `Specially crafted for those with sensitive skin, our Chamomile Calm bar provides the gentlest cleansing experience.

Chamomile's natural soothing properties combined with oat milk create a mild, hypoallergenic formula that cleanses without irritation. Perfect for babies, sensitive skin, or anyone who appreciates a gentle touch.

🌼 **Key Benefits:**
- Extra gentle formula
- Anti-inflammatory
- Hypoallergenic
- Fragrance-free option available`,
    price: 14.0,
    category: 'Relaxation',
    ingredients: 'Chamomile extract, oat milk, calendula, jojoba oil, vitamin E, aloe vera',
    imageUrl: 'https://images.unsplash.com/photo-1611073615830-6f2e82d00f6e?w=800&h=800&fit=crop',
    inStock: true,
    stockQuantity: 28,
    featured: false,
    weight: 4.0,
    sortOrder: 8,
  },
];

/**
 * ╭─────────────────────────────────────────────────────────╮
 * │  SEED FUNCTION                                           │
 * │  ─────────────────────────────────────────────────────── │
 * │  The main planting ceremony. 🌱                          │
 * ╰─────────────────────────────────────────────────────────╯
 */
async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const db = getDb();

  // Seed categories
  console.log('📁 Seeding categories...');
  for (const category of CATEGORIES) {
    try {
      await db.insert(categories).values(category).onConflictDoNothing();
      console.log(`   ✓ ${category.name}`);
    } catch (error) {
      console.log(`   ⚠ ${category.name} (already exists or error)`);
    }
  }
  console.log('');

  // Seed products
  console.log('🧼 Seeding products...');
  for (const product of PRODUCTS) {
    try {
      await db.insert(products).values(product).onConflictDoNothing();
      console.log(`   ✓ ${product.name} ($${product.price})`);
    } catch (error) {
      console.log(`   ⚠ ${product.name} (already exists or error)`);
    }
  }
  console.log('');

  // Create admin user (if not exists)
  console.log('👤 Creating admin user...');
  try {
    const adminPassword = await hashPassword('admin123');
    await db.insert(users).values({
      email: 'admin@karenssoap.com',
      passwordHash: adminPassword,
      role: 'admin',
      firstName: 'Karen',
      lastName: 'Soapmaker',
      emailVerified: true,
    }).onConflictDoNothing();
    console.log('   ✓ admin@karenssoap.com (password: admin123)');
  } catch (error) {
    console.log('   ⚠ Admin user already exists or error');
  }

  // Create test customer (if not exists)
  console.log('👤 Creating test customer...');
  try {
    const customerPassword = await hashPassword('customer123');
    await db.insert(users).values({
      email: 'customer@example.com',
      passwordHash: customerPassword,
      role: 'customer',
      firstName: 'Test',
      lastName: 'Customer',
      emailVerified: true,
    }).onConflictDoNothing();
    console.log('   ✓ customer@example.com (password: customer123)');
  } catch (error) {
    console.log('   ⚠ Customer user already exists or error');
  }

  console.log('\n✨ Database seeding complete!');
  console.log('\n📋 Summary:');
  console.log(`   - ${CATEGORIES.length} categories`);
  console.log(`   - ${PRODUCTS.length} products`);
  console.log(`   - 2 test users (admin + customer)`);
  console.log('\n🔐 Test Credentials:');
  console.log('   Admin:    admin@karenssoap.com / admin123');
  console.log('   Customer: customer@example.com / customer123');
}

// Run the seed function
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
