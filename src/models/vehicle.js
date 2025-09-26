import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Vehicle = sequelize.define('Vehicle', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    plate: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    brand: {
        type: DataTypes.STRING,
    },
    model: {
        type: DataTypes.STRING,
    },
    model_year: {
        type: DataTypes.INTEGER,
    },
    type: {
        type: DataTypes.STRING,
    },
    category: {
        type: DataTypes.STRING,
    },
    engine_no: {
        type: DataTypes.STRING,
    },
    chassis_no: {
        type: DataTypes.STRING,
    },
    tax_due_date: {
        type: DataTypes.DATE,
    },
    status: {
        type: DataTypes.STRING,
    },
    
    kurum_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kurum',
            key: 'id',
        }
    },
    mintika_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kurum',
            key: 'id',
        }
    },
    registration_info: {
        type: DataTypes.STRING,
    },
    owner_name: {
        type: DataTypes.STRING,
    },
    owner_phone: {
        type: DataTypes.STRING,
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    crtuser: {
        type: DataTypes.STRING,
    },
    crtdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'vehicle',
    timestamps: false,
});

export default Vehicle;
