import { DataTypes } from 'sequelize';
import  {sequelize} from '../config/db.js';  // Sequelize örneğinizi doğru şekilde içe aktarın (.js uzantısı ekleyin)
const Mintika = sequelize.define('Mintika', {
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
    crtuser: {
        type: DataTypes.STRING,
    },
    crtdate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }

    // crtuser ve crtdate alanları Sequelize tarafından yönetilebilir
    // veya manuel olarak eklenebilir. Şimdilik basit tutalım.
}, {
    tableName: 'mintika', // Veritabanındaki tablo adı
    timestamps: false, // createdAt ve updatedAt kolonlarını otomatik yönet
});

export default Mintika;
