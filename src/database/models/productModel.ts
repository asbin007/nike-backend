import {
  Table,
  Column,
  Model,
  DataType,
  
} from "sequelize-typescript";

@Table({
  tableName: "shoes",
  modelName: "Shoe",
  timestamps: true,
})
class Shoe extends Model {
  @Column({
    primaryKey: true,
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  declare brand: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare price: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  declare discount: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare originalPrice: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare costPrice: number;

  @Column({ 
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare features: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare sizes: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare colors: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  declare images: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  declare inStock: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  declare isNew: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: 0,
  })
  declare totalStock: Number;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare categoryId: string;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare collectionId: string;
  
}

export default Shoe;
