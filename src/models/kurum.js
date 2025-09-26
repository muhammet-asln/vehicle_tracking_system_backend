import { DataTypes } from 'sequelize';
import  {sequelize} from '../config/db.js';

const Kurum = sequelize.define('Kurum', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    responsible_name: {
        type: DataTypes.STRING,
    },
    responsible_phone: {
        type: DataTypes.STRING,
    },
    mintika_id: {
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: {
            model: 'mintika', // mintika tablosuna referans
            key: 'id',
        }
    },
    crtuser: {
        type: DataTypes.STRING,
    },
    crtdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

}, {
    tableName: 'kurum',
    timestamps: false,  // createdAt ve updatedAt kolonlarını otomatik yönetme 
});

export default Kurum;
