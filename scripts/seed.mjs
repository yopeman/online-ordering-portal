import mongoose from "mongoose";

/**
 * Seeds the database with an admin account, a business owner and demo
 * businesses so the portal is usable straight after install.
 *
 * Usage: npm run seed
 */

const MONGO_URI = process.env.MONGO_URI ?? process.env.MONGODB_URI;

const businesses = [
  {
    name: "Yope Coffee House",
    category: "Coffee shop",
    location: "Addis Ababa, Bole",
    description:
      "Specialty coffee roasted in Addis Ababa. Beans from Sidama, Yirgacheffe and Guji.",
    phones: ["+251911000001", "+251911000002"],
    products: [
      { name: "Espresso", category: "Hot drinks", price: 90, description: "Double shot, 30ml." },
      { name: "Macchiato", category: "Hot drinks", price: 110, description: "Espresso with foamed milk." },
      { name: "V60 Pour Over", category: "Hot drinks", price: 140, description: "Single origin, brewed to order." },
      { name: "Cold Brew", category: "Cold drinks", price: 120, description: "18 hour steeped cold brew." },
      { name: "Croissant", category: "Bakery", price: 70, description: "Butter croissant, baked daily." },
      { name: "Teff Sourdough", category: "Bakery", price: 85, description: "Stone baked teff loaf." },
    ],
  },
  {
    name: "Habesha Kitchen",
    category: "Restaurant",
    location: "Addis Ababa, Piazza",
    description: "Traditional Ethiopian dishes served on a shared platter.",
    phones: [
      { type: "sms", target: "+251911000003" },
      { type: "telegram", target: "habeshakitchen" },
    ],
    products: [
      { name: "Injera with Doro Wat", category: "Mains", price: 480, description: "Chicken stew with berbere." },
      { name: "Kitfo", category: "Mains", price: 320, description: "Minced beef with ayib cheese." },
      { name: "Misir Wot", category: "Mains", price: 240, description: "Lentil stew with garlic." },
      { name: "Firfir", category: "Mains", price: 260, description: "Shredded injera with berbere." },
      { name: "Ambasha", category: "Sides", price: 180, description: "Spiced fermented corn." },
    ],
  },
  {
    name: "Blue Nile Juice Bar",
    category: "Drinks",
    location: "Addis Ababa, Merkato",
    description: "Fresh pressed juice, smoothies and iced coffee.",
    phones: [
      { type: "sms", target: "+251911000004" },
      { type: "wa", target: "+251911000005" },
    ],
    products: [
      { name: "Mango Juice", category: "Juices", price: 150, description: "250ml, no sugar added." },
      { name: "Papaya Juice", category: "Juices", price: 140 },
      { name: "Avocado Smoothie", category: "Smoothies", price: 190, description: "With milk and honey." },
      { name: "Iced Coffee", category: "Cold drinks", price: 130 },
    ],
  },
];

function slugify(input) {
  return (
    input
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "item"
  );
}

function collectionSchema() {
  const Schema = mongoose.Schema;
  const user = new Schema(
    {
      name: String,
      email: { type: String, unique: true, lowercase: true },
      provider: String,
      providerId: String,
      status: { type: String, default: "active" },
      role: { type: String, default: "business_owner" },
      maxBusinesses: { type: Number, default: 3 },
      maxCatalogs: { type: Number, default: 50 },
      image: { type: String, default: "" },
    },
    { timestamps: true, collection: "users" },
  );

  const business = new Schema(
    {
      name: String,
      slug: { type: String, unique: true, lowercase: true },
      owner: { type: Schema.Types.ObjectId, ref: "User" },
      details: { type: Schema.Types.Mixed, default: {} },
      orderFormTemplates: { type: [Schema.Types.Mixed], default: [] },
      contactPhones: { type: Schema.Types.Mixed, default: [] },
      image: { type: String, default: "" },
      status: { type: String, enum: ["visible", "hide"], default: "visible" },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true, collection: "businesses" },
  );

  const catalog = new Schema(
    {
      name: String,
      slug: { type: String, unique: true, lowercase: true },
      business: { type: Schema.Types.ObjectId, ref: "Business" },
      category: { type: String, default: "" },
      details: { type: Schema.Types.Mixed, default: {} },
      price: { type: Number, default: 0 },
      currency: { type: String, default: "ETB" },
      image: { type: String, default: "" },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true, collection: "catalogs" },
  );

  const order = new Schema(
    {
      product: { type: Schema.Types.ObjectId, ref: "Catalog" },
      business: { type: Schema.Types.ObjectId, ref: "Business" },
      isRead: { type: Boolean, default: false },
      details: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true, collection: "orders" },
  );

  const activity = new Schema(
    {
      business: { type: Schema.Types.ObjectId, ref: "Business" },
      isRead: { type: Boolean, default: false },
      action: String,
      detail: String,
      actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true, collection: "activities" },
  );

  return {
    User: mongoose.models.User ?? mongoose.model("User", user),
    Business: mongoose.models.Business ?? mongoose.model("Business", business),
    Catalog: mongoose.models.Catalog ?? mongoose.model("Catalog", catalog),
    Order: mongoose.models.Order ?? mongoose.model("Order", order),
    Activity: mongoose.models.Activity ?? mongoose.model("Activity", activity),
  };
}

async function main() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log(`Connected to ${MONGO_URI.replace(/\/\/[^@]*@/, "//***@")}`);

  const { User, Business, Catalog, Order, Activity } = collectionSchema();

  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.create({
      name: "Yope Admin",
      email: "admin@yope.local",
      provider: "seed",
      providerId: "seed:admin",
      role: "admin",
      status: "active",
      maxBusinesses: 1000,
      maxCatalogs: 1000,
    });
    console.log(`Created admin  ${admin.email}`);
  } else {
    console.log(`Admin exists  ${admin.email}`);
  }

  let owner = await User.findOne({ email: "owner@yope.local" });
  if (!owner) {
    owner = await User.create({
      name: "Demo Owner",
      email: "owner@yope.local",
      provider: "seed",
      providerId: "seed:owner",
      role: "business_owner",
      status: "active",
      maxBusinesses: 10,
      maxCatalogs: 100,
    });
    console.log(`Created owner  ${owner.email}`);
  } else {
    console.log(`Owner exists  ${owner.email}`);
  }

  for (const [index, entry] of businesses.entries()) {
    const slug = slugify(entry.name);
    let business = await Business.findOne({ slug });

    if (!business) {
      business = await Business.create({
        name: entry.name,
        slug,
        owner: owner._id,
        image: "",
        status: "visible",
        isActive: true,
        contactPhones: entry.phones,
        details: {
          description: entry.description,
          category: entry.category,
          location: entry.location,
        },
        orderFormTemplates: [
          { key: "customerName", label: "Full name", type: "text", required: true },
          { key: "phone", label: "Phone number", type: "tel", required: true },
          {
            key: "delivery",
            label: "Delivery or pickup",
            type: "select",
            required: true,
            options: ["Delivery", "Pickup"],
          },
          { key: "note", label: "Note", type: "textarea", required: false },
        ],
      });
      console.log(`Created business ${business.name}`);
    }

    for (const product of entry.products) {
      const productSlug = `${slugify(product.name)}-${business._id.toString().slice(-6)}`;
      const exists = await Catalog.findOne({ slug: productSlug });
      if (exists) continue;

      const doc = await Catalog.create({
        name: product.name,
        slug: productSlug,
        business: business._id,
        category: product.category,
        price: product.price,
        currency: "ETB",
        isActive: true,
        details: { description: product.description ?? "" },
      });

      if (index === 0 && !product.description) {
        await Catalog.updateOne({ _id: doc._id }, { $set: { "details.description": "" } });
      }

      await Order.create({
        product: doc._id,
        business: business._id,
        isRead: index !== 0,
        details: {
          quantity: 1 + (index % 3),
          customerName: ["Selam Bekele", "Abdi Kebede", "Marta Tesfaye"][index % 3],
          phone: `+25191${1000000 + index * 11111}`,
          unitPrice: product.price,
          currency: "ETB",
          total: product.price,
          custom: { delivery: "Pickup" },
        },
      });
    }

    const existingActivity = await Activity.findOne({
      business: business._id,
      action: "business.created",
    });
    if (!existingActivity) {
      await Activity.create({
        business: business._id,
        action: "business.created",
        detail: `**${owner.name}** created the business **${business.name}**.`,
        actor: owner._id,
        isRead: true,
      });
    }
  }

  const counts = {
    users: await User.countDocuments(),
    businesses: await Business.countDocuments(),
    catalogs: await Catalog.countDocuments(),
    orders: await Order.countDocuments(),
    activities: await Activity.countDocuments(),
  };

  console.log("Seed complete:", counts);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});