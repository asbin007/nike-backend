import bcrypt from 'bcrypt';
import { Sequelize } from 'sequelize';

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false
});

// User model (simplified)
const User = sequelize.define('User', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    primaryKey: true
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('customer', 'admin', 'super_admin'),
    defaultValue: 'customer'
  },
  isVerified: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    field: 'isverified'
  }
}, {
  tableName: 'users',
  timestamps: true
});

async function createSuperAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({
      where: { 
        email: 'super@gmail.com',
        role: 'super_admin'
      }
    });

    if (existingSuperAdmin) {
      console.log('ℹ️ Super admin already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('12345678', 10);

    // Create super admin
    const superAdmin = await User.create({
      username: 'superadmin',
      email: 'super@gmail.com',
      password: hashedPassword,
      role: 'super_admin',
      isVerified: true
    });

    console.log('✅ Super admin created successfully:');
    console.log('Email:', superAdmin.email);
    console.log('Username:', superAdmin.username);
    console.log('Role:', superAdmin.role);
    console.log('ID:', superAdmin.id);

  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    await sequelize.close();
  }
}

createSuperAdmin();
