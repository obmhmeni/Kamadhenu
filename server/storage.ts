import { 
  Product, InsertProduct, Order, InsertOrder, User, InsertUser, 
  Role, InsertRole, StockHistory, InsertStockHistory, Inventory, 
  InsertInventory, RawTransaction, InsertRawTransaction, Transaction, 
  InsertTransaction, Setting, InsertSetting, UserInfo, InsertUserInfo 
} from "@shared/schema";

const getISTTime = () => new Date().toLocaleString('en-IN', { 
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}).replace(/(\d{2})\/(\d{2})\/(\d{4}),/, '$3-$2-$1');

// Item contacts mapping
const itemContacts: Record<string, string> = {
  'potato SouthDelhi': '6338398272',
  'tomato CentralDelhi': '1770010257',
  'onion SouthDelhi': '9789180980',
  'rice Chennai': '1728097771',
  'daal Shahdara': '9661378976',
  'carrot NorthDelhi': '5555555555',
  'wheat Chennai': '6666666666',
  'chocolate SouthDelhi': '6338398272',
  'chocolate Chennai': '5385320149',
  'Cake SouthDelhi': '6338398272'
};

export interface IStorage {
  // Products
  getProducts(district?: string): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  getProductByNameDistrictUnique(name: string, district: string, uniqueNumber: number): Promise<Product | undefined>;
  getNextUniqueNumber(name: string, district: string): Promise<number>;
  
  // Orders
  getOrders(district?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  getOrdersByPaymentStatus(status: string): Promise<Order[]>;
  getOrderByAmountAndPhone(amount: number, phone: string): Promise<Order | undefined>;
  
  // Users
  getUsers(): Promise<User[]>;
  getUser(telegramId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(telegramId: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Roles
  getRoles(): Promise<Role[]>;
  getUserRoles(telegramId: string): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  deleteRole(telegramId: string, role: string): Promise<boolean>;
  
  // Stock History
  createStockHistory(history: InsertStockHistory): Promise<StockHistory>;
  getStockHistory(productId: number): Promise<StockHistory[]>;
  
  // Inventory
  getInventory(productId: number): Promise<Inventory | undefined>;
  updateInventory(inventory: InsertInventory): Promise<Inventory>;
  
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getUnmatchedTransactions(): Promise<Transaction[]>;
  
  // Raw Transactions
  createRawTransaction(rawTransaction: InsertRawTransaction): Promise<RawTransaction>;
  getRawTransactions(): Promise<RawTransaction[]>;
  
  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  
  // User Info
  getUserInfo(telegramId: string): Promise<UserInfo | undefined>;
  createOrUpdateUserInfo(userInfo: InsertUserInfo): Promise<UserInfo>;
  
  // Dashboard stats
  getDashboardStats(): Promise<{
    totalProducts: number;
    pendingOrders: number;
    lowStockItems: number;
    totalRevenue: number;
  }>;
}

export class MemStorage implements IStorage {
  private products: Map<number, Product> = new Map();
  private orders: Map<number, Order> = new Map();
  private users: Map<string, User> = new Map();
  private roles: Role[] = [];
  private stockHistories: StockHistory[] = [];
  private inventories: Map<number, Inventory> = new Map();
  private transactions: Map<number, Transaction> = new Map();
  private rawTransactions: Map<number, RawTransaction> = new Map();
  private settings: Map<string, Setting> = new Map();
  private userInfos: Map<string, UserInfo> = new Map();
  
  private currentProductId = 1;
  private currentOrderId = 1;
  private currentStockHistoryId = 1;
  private currentTransactionId = 1;
  private currentRawTransactionId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Default admin user
    this.users.set("6338398272", {
      telegramId: "6338398272",
      name: "Harshit Sharma",
      primaryPhone: "9876543210",
      secondaryPhone: "9876543211",
      district: "SouthDelhi",
      registeredAt: getISTTime(),
      language: "English"
    });

    // District head user
    this.users.set("5385320149", {
      telegramId: "5385320149",
      name: "Raj Singh",
      primaryPhone: "9876543220",
      secondaryPhone: "9876543221",
      district: "SouthDelhi",
      registeredAt: getISTTime(),
      language: "English"
    });

    // Default roles
    this.roles.push(
      { telegramId: "6338398272", role: "admin", district: undefined },
      { telegramId: "5385320149", role: "district_head", district: "SouthDelhi" }
    );

    // Default settings
    this.settings.set("low_stock_threshold", { key: "low_stock_threshold", value: "100" });
    this.settings.set("order_timeout", { key: "order_timeout", value: "6" });

    // Sample products
    const sampleProducts = [
      { name: "Potato", quantity: 150, district: "SouthDelhi", addedBy: "6338398272", price: 45, category: "vegetables" },
      { name: "Tomato", quantity: 23, district: "CentralDelhi", addedBy: "6338398272", price: 80, category: "vegetables" },
      { name: "Rice", quantity: 67, district: "Chennai", addedBy: "6338398272", price: 120, category: "grains" }
    ];

    sampleProducts.forEach(product => {
      this.createProduct(product);
    });

    // Sample orders
    const sampleOrders = [
      {
        telegramId: "user1",
        name: "Raj Kumar",
        address: "Main Road, Block A",
        orderDetails: "Potato 2kg, Tomato 1kg",
        productIds: "1,2",
        totalAmount: 150,
        phone: "9876543210",
        paymentStatus: "Pending",
        orderStatus: "Processing",
        district: "SouthDelhi"
      },
      {
        telegramId: "user2", 
        name: "Priya Singh",
        address: "Garden Street, Ward 5",
        orderDetails: "Rice 5kg, Daal 2kg",
        productIds: "3",
        totalAmount: 890,
        phone: "9876543211",
        paymentStatus: "Confirmed",
        orderStatus: "Packed",
        district: "Chennai"
      }
    ];

    sampleOrders.forEach(order => {
      this.createOrder(order);
    });
  }

  // Products
  async getProducts(district?: string): Promise<Product[]> {
    const products = Array.from(this.products.values());
    if (district) {
      return products.filter(p => p.district === district);
    }
    return products;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const uniqueNumber = await this.getNextUniqueNumber(product.name, product.district);
    const newProduct: Product = {
      id: this.currentProductId++,
      uniqueNumber,
      ...product
    };
    this.products.set(newProduct.id, newProduct);
    
    // Create stock history
    await this.createStockHistory({
      productId: newProduct.id,
      action: "ADD",
      quantity: product.quantity
    });
    
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const existing = this.products.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...product };
    this.products.set(id, updated);
    
    if (product.quantity !== undefined) {
      await this.createStockHistory({
        productId: id,
        action: "UPDATE",
        quantity: product.quantity
      });
    }
    
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async getProductByNameDistrictUnique(name: string, district: string, uniqueNumber: number): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(p => 
      p.name.toLowerCase() === name.toLowerCase() && 
      p.district === district && 
      p.uniqueNumber === uniqueNumber
    );
  }

  async getNextUniqueNumber(name: string, district: string): Promise<number> {
    const products = Array.from(this.products.values()).filter(p => 
      p.name.toLowerCase() === name.toLowerCase() && p.district === district
    );
    return products.length > 0 ? Math.max(...products.map(p => p.uniqueNumber)) + 1 : 1;
  }

  // Orders
  async getOrders(district?: string): Promise<Order[]> {
    const orders = Array.from(this.orders.values());
    if (district) {
      return orders.filter(o => o.district === district);
    }
    return orders;
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const now = getISTTime();
    const newOrder: Order = {
      id: this.currentOrderId++,
      createdAt: now,
      dateOrdered: now,
      ...order
    };
    this.orders.set(newOrder.id, newOrder);
    return newOrder;
  }

  async updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined> {
    const existing = this.orders.get(id);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...order };
    this.orders.set(id, updated);
    return updated;
  }

  async getOrdersByPaymentStatus(status: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.paymentStatus === status);
  }

  async getOrderByAmountAndPhone(amount: number, phone: string): Promise<Order | undefined> {
    return Array.from(this.orders.values()).find(o => 
      o.totalAmount === amount && 
      (o.phone === phone || o.phone === `+91${phone}` || o.phone === phone.replace('+91', ''))
    );
  }

  // Users
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUser(telegramId: string): Promise<User | undefined> {
    return this.users.get(telegramId);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      registeredAt: getISTTime(),
      ...user
    };
    this.users.set(newUser.telegramId, newUser);
    return newUser;
  }

  async updateUser(telegramId: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(telegramId);
    if (!existing) return undefined;
    
    const updated = { ...existing, ...user };
    this.users.set(telegramId, updated);
    return updated;
  }

  // Roles
  async getRoles(): Promise<Role[]> {
    return [...this.roles];
  }

  async getUserRoles(telegramId: string): Promise<Role[]> {
    return this.roles.filter(r => r.telegramId === telegramId);
  }

  async createRole(role: InsertRole): Promise<Role> {
    // Remove existing role of same type for user
    this.roles = this.roles.filter(r => !(r.telegramId === role.telegramId && r.role === role.role));
    this.roles.push(role);
    return role;
  }

  async deleteRole(telegramId: string, role: string): Promise<boolean> {
    const initialLength = this.roles.length;
    this.roles = this.roles.filter(r => !(r.telegramId === telegramId && r.role === role));
    return this.roles.length < initialLength;
  }

  // Stock History
  async createStockHistory(history: InsertStockHistory): Promise<StockHistory> {
    const newHistory: StockHistory = {
      id: this.currentStockHistoryId++,
      timestamp: getISTTime(),
      ...history
    };
    this.stockHistories.push(newHistory);
    return newHistory;
  }

  async getStockHistory(productId: number): Promise<StockHistory[]> {
    return this.stockHistories.filter(h => h.productId === productId);
  }

  // Inventory
  async getInventory(productId: number): Promise<Inventory | undefined> {
    return this.inventories.get(productId);
  }

  async updateInventory(inventory: InsertInventory): Promise<Inventory> {
    this.inventories.set(inventory.productId, inventory);
    return inventory;
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const now = getISTTime();
    const newTransaction: Transaction = {
      id: this.currentTransactionId++,
      createdAt: now,
      dateReceived: now,
      ...transaction
    };
    this.transactions.set(newTransaction.id, newTransaction);
    return newTransaction;
  }

  async getUnmatchedTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(t => t.status === "Pending");
  }

  // Raw Transactions
  async createRawTransaction(rawTransaction: InsertRawTransaction): Promise<RawTransaction> {
    const newRawTransaction: RawTransaction = {
      id: this.currentRawTransactionId++,
      createdAt: getISTTime(),
      ...rawTransaction
    };
    this.rawTransactions.set(newRawTransaction.id, newRawTransaction);
    return newRawTransaction;
  }

  async getRawTransactions(): Promise<RawTransaction[]> {
    return Array.from(this.rawTransactions.values());
  }

  // Settings
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    this.settings.set(setting.key, setting);
    return setting;
  }

  // User Info
  async getUserInfo(telegramId: string): Promise<UserInfo | undefined> {
    return this.userInfos.get(telegramId);
  }

  async createOrUpdateUserInfo(userInfo: InsertUserInfo): Promise<UserInfo> {
    const newUserInfo: UserInfo = {
      updatedAt: getISTTime(),
      ...userInfo
    };
    this.userInfos.set(newUserInfo.telegramId, newUserInfo);
    return newUserInfo;
  }

  // Dashboard stats
  async getDashboardStats(): Promise<{
    totalProducts: number;
    pendingOrders: number;
    lowStockItems: number;
    totalRevenue: number;
  }> {
    const threshold = parseInt((await this.getSetting("low_stock_threshold"))?.value || "100");
    
    return {
      totalProducts: this.products.size,
      pendingOrders: Array.from(this.orders.values()).filter(o => o.paymentStatus === "Pending").length,
      lowStockItems: Array.from(this.products.values()).filter(p => p.quantity < threshold).length,
      totalRevenue: Array.from(this.orders.values())
        .filter(o => o.paymentStatus === "Confirmed")
        .reduce((sum, o) => sum + o.totalAmount, 0)
    };
  }
}

export const storage = new MemStorage();
