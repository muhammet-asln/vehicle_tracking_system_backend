import User from './user.js';
import Kurum from './kurum.js';
import Mintika from './mintika.js';
import Vehicle from './vehicle.js';
import Trip from './trip.js';

function applyAssociations() {
    // Bir Kurum, bir Mıntıka'ya aittir.
    Kurum.belongsTo(Mintika, { foreignKey: 'mintika_id' });
    Mintika.hasMany(Kurum, { foreignKey: 'mintika_id' });

    // Bir User, bir Kurum'a ve bir Mıntıka'ya aittir.
    User.belongsTo(Kurum, { foreignKey: 'kurum_id' });
    User.belongsTo(Mintika, { foreignKey: 'mintika_id' });

    // Bir Vehicle, bir Kurum'a aittir.
    Vehicle.belongsTo(Kurum, { foreignKey: 'kurum_id' });
    Kurum.hasMany(Vehicle, { foreignKey: 'kurum_id' });

    // Bir Trip, bir User'a ve bir Vehicle'a aittir.
    Trip.belongsTo(User, { foreignKey: 'user_id' });
    Trip.belongsTo(Vehicle, { foreignKey: 'vehicle_id' });
}

export default applyAssociations;
