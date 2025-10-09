import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Trip = sequelize.define('Trip', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    vehicle_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'vehicle', key: 'id' }
    },
    assigned_by: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' }
    },
    triptype: {
        type: DataTypes.ENUM('assigned', 'requested'),
        allowNull: false,
    },
   status: {
        type: DataTypes.VIRTUAL,
        get() {
            // Eğer enddate doluysa 'completed', boşsa 'active' dönder.
            return this.enddate ? 'completed' : 'active';
        },
    },
        
    destination: {
        type: DataTypes.STRING,
    },
    reason: {
        type: DataTypes.STRING,
    },
    description: {
        type: DataTypes.TEXT,
    },
    start_date: {
        type: DataTypes.DATE,
    },
    end_date: {
        type: DataTypes.DATE,
    },
   
    return_estimate: {
        type: DataTypes.DATE,
    },
  
    first_photo: {
        type: DataTypes.STRING,
    },
    last_photo: {
        type: DataTypes.STRING,
    },
    crtuser: {
        type: DataTypes.STRING,
    },
    crtdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    
}, {
    tableName: 'trip',
    timestamps: false,
});

export default Trip;