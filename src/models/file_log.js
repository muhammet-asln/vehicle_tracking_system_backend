// models/file_log.js

import { DataTypes } from 'sequelize';



export default (sequelize) => {

  const FileLog = sequelize.define(

    'FileLog',

    {

      id: {

        type: DataTypes.BIGINT,

        autoIncrement: true,

        primaryKey: true,

      },

      type: {

        type: DataTypes.STRING(20),

        allowNull: true,

      },

      vehicle_front: {

        type: DataTypes.STRING(1024),

        allowNull: false,

      },

      vehicle_back: {

        type: DataTypes.STRING(1024),

        allowNull: false,

      },

      vehicle_left: {

        type: DataTypes.STRING(1024),

        allowNull: false,

      },

      vehicle_right: {

        type: DataTypes.STRING(1024),

        allowNull: false,

      },

      vehicle_inside: {

        type: DataTypes.STRING(1024),

        allowNull: false,

      },

      crtuser: {

        type: DataTypes.STRING(50),

        allowNull: true,

      },

      crtdate: {

        type: DataTypes.DATE,

        allowNull: false,

        defaultValue: DataTypes.NOW,

      },

    },

    {

      tableName: 'file_log',

      schema: 'public',

      timestamps: false, // çünkü createdAt / updatedAt yok

      underscored: true, // sütunlar zaten snake_case

    }

  );



  return FileLog;

};

