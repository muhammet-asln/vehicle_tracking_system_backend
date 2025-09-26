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
    // Senaryoya göre eklendi: 'PLAN' (Yönetici planladı), 'REQUEST' (Kullanıcı talep etti)
    trip_type: {
        type: DataTypes.ENUM('PLAN', 'REQUEST'),
        allowNull: false,
    },
    // Senaryoya göre eklendi: Yolculuğun yaşam döngüsünü takip eder
    status: {
        type: DataTypes.ENUM('Planned', 'Requested', 'Active', 'Completed', 'Cancelled'),
        allowNull: false,
    },
    destination: { // Gidilecek yer/güzergah
        type: DataTypes.STRING,
    },
    reason: { // Seyahat amacı
        type: DataTypes.STRING,
    },
    description: { // Ek açıklamalar
        type: DataTypes.TEXT,
    },
    request_date: { // Kullanıcının talep oluşturduğu tarih
        type: DataTypes.DATE,
    },
    assigned_date: { // Yöneticinin atamayı yaptığı/onayladığı tarih
        type: DataTypes.DATE,
    },
    return_estimate: { // Tahmini dönüş tarihi
        type: DataTypes.DATE,
    },
    return_date: { // Gerçekleşen dönüş tarihi
        type: DataTypes.DATE,
    },
    start_km: { // Senaryoya göre eklendi: Teslim alırkenki KM
        type: DataTypes.INTEGER,
    },
    end_km: { // Senaryoya göre eklendi: Teslim ederkenki KM
        type: DataTypes.INTEGER,
    },
    first_photo: { // Teslim alırkenki fotoğrafın yolu
        type: DataTypes.STRING,
    },
    last_photo: { // Teslim ederkenki fotoğrafın yolu
        type: DataTypes.STRING,
    },
    cruser: {
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
