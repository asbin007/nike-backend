import { Sequelize } from "sequelize-typescript";
import { envConfig } from "../config/config.ts";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Category from "./models/categoryModel.ts";
import ProductReview from "./models/productReviewModal.ts";
import Shoe from "./models/productModel.ts";
import User from "./models/userModel.ts";
import Collection from "./models/collectionModel.ts";
import Cart from "./models/cartModel.ts";
import Order from "./models/orderModel.ts";
import Payment from "./models/paymentModel.ts";
import OrderDetails from "./models/orderDetaills.ts"; 
import Chat from "./models/chatModel.ts";
import Message from "./models/messageModel.ts";

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if database URL exists
if (!envConfig.databaseUrl) {
  console.error("DATABASE_URL environment variable is not set!");
  console.error("Please set DATABASE_URL in Render environment variables");
  // Don't exit in production, let the app start without database
  if (process.env.NODE_ENV === 'production') {
    console.log("Starting without database connection...");
  } else {
    process.exit(1);
  }
}

// Configure SSL based on environment
const dialectOptions: any = {};
if (process.env.NODE_ENV === 'production') {
  // Supabase specific configuration
if (envConfig.databaseUrl && envConfig.databaseUrl.includes('supabase.co')) {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: false
  };
  // Disable native for Supabase to avoid SASL issues
  dialectOptions.native = false;
  
  // Additional Supabase specific settings
  dialectOptions.keepAlive = true;
  dialectOptions.keepAliveInitialDelayMillis = 10000;
  
  // Fix for SASL authentication issues
  dialectOptions.prepare = false;
  dialectOptions.statement_timeout = 60000;
  dialectOptions.idle_in_transaction_session_timeout = 60000;
  
  // Additional settings to fix SASL issues
  dialectOptions.connectionTimeoutMillis = 30000;
  dialectOptions.query_timeout = 60000;
  dialectOptions.application_name = 'nike-backend';
  
  // SASL authentication fix
  dialectOptions.sasl = {
    mechanism: 'SCRAM-SHA-256'
  };
} else if (envConfig.databaseUrl && envConfig.databaseUrl.includes('render.com')) {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
    dialectOptions.native = true;
  } else if (envConfig.databaseUrl && envConfig.databaseUrl.includes('heroku.com')) {
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
    dialectOptions.native = true;
  } else {
    // Default production SSL configuration
    dialectOptions.ssl = {
      require: true,
      rejectUnauthorized: false
    };
    dialectOptions.native = true;
  }
} else {
  // Disable SSL for development
  dialectOptions.ssl = false;
}

// Use DATABASE_URL directly without any parsing to preserve case sensitivity
let databaseUrl = envConfig.databaseUrl as string;
let isPoolerConnection = false; // Flag to track if we're using pooler
let sequelize: Sequelize; // Declare sequelize variable early

// Add pgbouncer=true parameter for Supabase connection pooling (only for pooler connections)
if (databaseUrl && databaseUrl.includes('pooler.supabase.com') && !databaseUrl.includes('pgbouncer=true')) {
  databaseUrl += '?pgbouncer=true';
  console.log('Added pgbouncer=true to pooler DATABASE_URL');
}

// URL encode the username if it contains special characters
if (databaseUrl && databaseUrl.includes('postgres.kynslinvksgdxltlxgxl')) {
  const encodedUsername = encodeURIComponent('postgres.kynslinvksgdxltlxgxl');
  databaseUrl = databaseUrl.replace('postgres.kynslinvksgdxltlxgxl', encodedUsername);
  console.log('URL encoded username:', encodedUsername);
}

// For pooler connections, use connection string directly instead of parsing
if (databaseUrl && databaseUrl.includes('pooler.supabase.com')) {
  console.log('Using pooler connection - connecting directly with connection string');
  isPoolerConnection = true;
  
  // Create Sequelize instance for pooler connection with simplified SSL config
  sequelize = new Sequelize(databaseUrl, {
    models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      native: false,
      prepare: false
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      timeout: 10000
    }
  });
  console.log('Created Sequelize instance for pooler connection with simplified config');
}

// For direct connections, force IPv4
if (databaseUrl && databaseUrl.includes('db.kynslinvksgdxltlxgxl.supabase.co')) {
  console.log('Using direct connection - forcing IPv4');
  
  // Create Sequelize instance for direct connection with IPv4
  sequelize = new Sequelize(databaseUrl, {
    models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      native: false,
      prepare: false,
      // Force IPv4
      family: 4,
      // Additional IPv4 settings
      lookup: (hostname: string, options: any, callback: any) => {
        // Force IPv4 lookup
        require('dns').lookup(hostname, { family: 4 }, callback);
      }
    },
    pool: {
      max: 1,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      timeout: 10000
    }
  });
  console.log('Created Sequelize instance for direct connection with IPv4');
}

// Debug logging to see the exact values
console.log('Raw DATABASE_URL from envConfig:', envConfig.databaseUrl);
console.log('Raw DATABASE_URL from process.env:', process.env.DATABASE_URL);
console.log('Database URL being used:', databaseUrl);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Environment check - Production:', process.env.NODE_ENV === 'production');

// Try to fix the hostname case sensitivity issue by manually reconstructing the URL
if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    // Extract hostname manually without using URL constructor to preserve case
    const hostnameMatch = databaseUrl.match(/@([^:]+):/);
    if (hostnameMatch) {
      const extractedHostname = hostnameMatch[1];
      console.log('Extracted hostname manually:', extractedHostname);
      
      // Check if the extracted hostname has uppercase letters
      if (extractedHostname !== extractedHostname.toLowerCase()) {
        console.log('Detected case-sensitive hostname, attempting to preserve case...');
        
        // Parse the URL to get other components
        const url = new URL(databaseUrl);
        
        // Reconstruct the URL with the case-sensitive hostname
        const reconstructedUrl = `postgresql://${url.username}:${url.password}@${extractedHostname}:${url.port}${url.pathname}`;
        console.log('Reconstructed URL:', reconstructedUrl.replace(url.password, '***'));
        
        databaseUrl = reconstructedUrl;
      } else {
        console.log('Hostname is already lowercase, no reconstruction needed');
      }
    }
  } catch (error) {
    console.error('Error reconstructing URL:', error);
  }
}

// Log the original URL for debugging (without password)
if (databaseUrl && process.env.NODE_ENV === 'production') {
  try {
    const debugUrl = new URL(databaseUrl);
    const originalHostname = debugUrl.hostname;
    debugUrl.password = '***';
    console.log('Using DATABASE_URL with hostname:', originalHostname);
    console.log('Full DATABASE_URL (without password):', debugUrl.toString());
  } catch (error) {
    console.error('Could not parse DATABASE_URL for logging:', error);
  }
}

// Use the database URL directly with case-sensitive reconstruction
let finalDatabaseUrl = databaseUrl; // Make this accessible to connectDatabase function

console.log('Checking if database URL contains supabase.co...');
console.log('Database URL contains supabase.co:', databaseUrl.includes('supabase.co'));

// For Supabase, use individual parameters to preserve case sensitivity
if (databaseUrl && databaseUrl.includes('supabase.co')) {
  try {
    console.log('Attempting to parse Supabase connection string...');
    
    // Extract connection parameters manually to preserve case - handle both direct and pooler URLs
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    console.log('URL match result:', urlMatch);
    
    if (urlMatch) {
      const [, username, password, hostname, port, database] = urlMatch;
      console.log('Extracted connection parameters:');
      console.log('Hostname:', hostname);
      console.log('Port:', port);
      console.log('Database:', database);
      console.log('Username:', username);
      
              // Create Sequelize with individual parameters - use extracted hostname to preserve case
        console.log('Using extracted hostname:', hostname);
        
        sequelize = new Sequelize({
          dialect: 'postgres',
          host: hostname,
          port: parseInt(port),
          database: database,
          username: username,
          password: password,
          models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
          logging: false,
          dialectOptions,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          retry: {
            max: 3,
            timeout: 10000
          }
        });
        
        console.log('Created Sequelize instance with hardcoded hostname');
    } else {
      console.log('Regex failed to match, trying alternative parsing...');
      
      // Alternative parsing method
      const parts = databaseUrl.split('@');
      if (parts.length === 2) {
        const credentials = parts[0].replace('postgresql://', '');
        const hostAndDb = parts[1];
        
        const [username, password] = credentials.split(':');
        const [hostPort, database] = hostAndDb.split('/');
        const [hostname, port] = hostPort.split(':');
        
        console.log('Alternative parsing results:');
        console.log('Hostname:', hostname);
        console.log('Port:', port);
        console.log('Database:', database);
        console.log('Username:', username);
        
        // Create Sequelize with individual parameters - use extracted hostname to preserve case
        console.log('Using extracted hostname (alternative parsing):', hostname);
        
        sequelize = new Sequelize({
          dialect: 'postgres',
          host: hostname,
          port: parseInt(port),
          database: database,
          username: username,
          password: password,
          models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
          logging: false,
          dialectOptions,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          retry: {
            max: 3,
            timeout: 10000
          }
        });
        
        console.log('Created Sequelize instance with hardcoded hostname (alternative parsing)');
      } else {
        throw new Error('Could not parse connection string with alternative method');
      }
    }
  } catch (error) {
    console.error('Error parsing connection string:', error);
    // Fallback to connection string method
    sequelize = new Sequelize(databaseUrl, {
      models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
      logging: false,
      dialectOptions,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      },
      retry: {
        max: 3,
        timeout: 10000
      }
    });
  }
} else {
  // Use the reconstructed URL directly for non-Supabase databases
  sequelize = new Sequelize(databaseUrl, {
    models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
    logging: false,
    dialectOptions,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    retry: {
      max: 3,
      timeout: 10000
    }
  });
}

// Database connection with better error handling
const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    
    // Check if it's a SASL authentication error
    if (error instanceof Error && error.message.includes('SASL')) {
      console.error("SASL authentication error detected. This might be due to SSL configuration.");
      console.error("Trying alternative connection method...");
      
      // Try with different SSL settings
      try {
        const alternativeSequelize = new Sequelize(finalDatabaseUrl, {
          models: [Category, ProductReview, Shoe, User, Collection, Cart, Order, Payment, OrderDetails, Chat, Message],
          logging: false,
          dialectOptions: {
            ssl: {
              require: true,
              rejectUnauthorized: false
            },
            native: false,
            prepare: false
          },
          pool: {
            max: 1,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        });
        
        await alternativeSequelize.authenticate();
        console.log("Database connected successfully with alternative settings");
        return true;
      } catch (altError) {
        console.error("Alternative connection also failed:", altError);
      }
    }
    
    // In production, don't exit immediately, let the app start
    if (process.env.NODE_ENV === 'production') {
      console.log("Continuing without database connection...");
      return false;
    } else {
      console.error("Exiting due to database connection failure in development");
      process.exit(1);
    }
  }
};

// Initialize database connection
connectDatabase();

// category x product
Shoe.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Shoe, { foreignKey: "categoryId" });

// collection x product
Shoe.belongsTo(Collection, { foreignKey: "collectionId" });
Collection.hasMany(Shoe, { foreignKey: "collectionId" });

// user x review
ProductReview.belongsTo(User, { foreignKey: "userId" });
User.hasMany(ProductReview, { foreignKey: "userId" });

// product x review
ProductReview.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(ProductReview, { foreignKey: "productId" });

// product x cart
Cart.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(Cart, { foreignKey: "productId" });

// user x cart
Cart.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Cart, { foreignKey: "userId" });

// order x user
Order.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Order, { foreignKey: "userId" });

// payment x order
Order.belongsTo(Payment, { foreignKey: "paymentId" });
Payment.hasOne(Order, { foreignKey: "paymentId" });

// order x orderDetails
OrderDetails.belongsTo(Order, { foreignKey: "orderId" });
Order.hasOne(OrderDetails, { foreignKey: "orderId" });

// orderDetails x product
OrderDetails.belongsTo(Shoe, { foreignKey: "productId" });
Shoe.hasMany(OrderDetails, { foreignKey: "productId" });


// for chat
// Chat relations
Chat.belongsTo(User, { as: "Customer", foreignKey: "customerId" });
Chat.belongsTo(User, { as: "Admin", foreignKey: "adminId" });

User.hasMany(Chat, { as: "CustomerChats", foreignKey: "customerId" });
User.hasMany(Chat, { as: "AdminChats", foreignKey: "adminId" });

// Message relations
Message.belongsTo(Chat, { foreignKey: "chatId" });
Chat.hasMany(Message, { foreignKey: "chatId" });

Message.belongsTo(User, { as: "Sender", foreignKey: "senderId" });
Message.belongsTo(User, { as: "Receiver", foreignKey: "receiverId" });

User.hasMany(Message, { as: "SentMessages", foreignKey: "senderId" });
User.hasMany(Message, { as: "ReceivedMessages", foreignKey: "receiverId" });
export default sequelize;
