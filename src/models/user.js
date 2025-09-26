import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import {sequelize} from '../config/db.js'; // Veritabanı bağlantınız ve .js uzantısı

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
     name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Admin', 'Mıntıka Yöneticisi', 'Kurum Yöneticisi', 'Kullanıcı'), // Roller dokümanda belirtildiği gibi [cite: 27]
        allowNull: false
    },
    kurum_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'kurum',
            key: 'id'
        }
    }
    ,
    mintika_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'mintika',
            key: 'id'
        }
        },
         phone: {
        type: DataTypes.STRING
    },
    crtuser: {
        type: DataTypes.STRING
    },
    crtdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // true = active, false = inactive'
    },
  
}, {
    tableName: 'users',
    timestamps: false, // Eğer createdAt ve updatedAt sütunlarını kullanmayacaksanız kullanacaksanız true yapın ve migration dosyasında da ekleyin.
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
             if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});


export default User;