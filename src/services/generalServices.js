import { User, Vehicle, Kurum, Mintika, Trip } from '../models/index.js';
import { Op } from 'sequelize';

export const getDashboardStats = async (requester) => {
    const { role, kurum_id, mintika_id, id: userId } = requester;
    let data = {};

    // YARDIMCI: Meşgul araçları bul
    const activeTrips = await Trip.findAll({
        where: { end_date: null },
        attributes: ['vehicle_id']
    });
    const busyVehicleIds = activeTrips.map(t => t.vehicle_id);

    // =================================================================
    // ROL: ADMIN
    // =================================================================
    if (role === 'Admin') {
        const [totalVehicles, totalUsers, totalKurum, totalMintika, totalActiveTrips] = await Promise.all([
            Vehicle.count(),
            User.count(),
            Kurum.count(),
            Mintika.count(),
            Trip.count({ where: { end_date: null } })
        ]);

        data = {
            role: 'Admin',
            stats: {
                total_vehicles: totalVehicles,
                total_users: totalUsers,
                total_kurum: totalKurum,
                total_mintika: totalMintika,
                total_active_trips: totalActiveTrips
            }
        };
    }

    // =================================================================
    // ROL: MINTIKA YÖNETİCİSİ
    // =================================================================
    else if (role === 'Mıntıka Yöneticisi') {
        const [
            totalVehicles,
            activeVehiclesCount,
            totalPersonnel,
            activeTripsCount,
            totalKurum
        ] = await Promise.all([
            Vehicle.count({ where: { mintika_id } }),
            Vehicle.count({
                where: {
                    mintika_id,
                    is_active: true,
                    id: { [Op.notIn]: busyVehicleIds }
                }
            }),
            User.count({ where: { mintika_id } }),
            Trip.count({
                where: { end_date: null },
                include: [{ model: Vehicle, where: { mintika_id }, required: true }]
            }),
            Kurum.count({ where: { mintika_id } })
        ]);

        data = {
            role: 'Mıntıka Yöneticisi',
            mintika_id,
            stats: {
                total_vehicles: totalVehicles,
                available_vehicles: activeVehiclesCount,
                total_personnel: totalPersonnel,
                active_trips_count: activeTripsCount,
                total_kurum: totalKurum
            }
        };
    }

    // =================================================================
    // ROL: KURUM YÖNETİCİSİ (DÜZLEŞTİRİLEN KISIM BURASI)
    // =================================================================
    else if (role === 'Kurum Yöneticisi') {
        
        // 1. Kişisel istatistikleri yardımcı fonksiyondan al
        const { stats: personalStats, history } = await getUserPersonalStats(userId, kurum_id, busyVehicleIds);

        // 2. Yönetimsel istatistikleri hesapla
        const [totalPersonnel, activeTripsCount] = await Promise.all([
            User.count({ where: { kurum_id } }),
            Trip.count({
                where: { end_date: null },
                include: [{ model: Vehicle, where: { kurum_id }, required: true }]
            })
        ]);

        data = {
            role: 'Kurum Yöneticisi',
            kurum_id,
            // TEK BİR STATS OBJESİ OLUŞTURUYORUZ
            stats: {
                ...personalStats, // Kişisel verileri buraya yayıyoruz (spread)
                total_personnel: totalPersonnel,      // Yönetimsel veri
                active_trips_count: activeTripsCount, // Yönetimsel veri
                todays_plans: null                    // Yönetimsel veri
            },
            history: history // Geçmiş dizisi stats dışında kalmaya devam edebilir veya isterseniz içeri alabilirsiniz.
        };
    }

    // =================================================================
    // ROL: KULLANICI
    // =================================================================
    else {
        // Kullanıcıda zaten tek bir stats objesi dönüyor
        data = {
            role: 'Kullanıcı',
            kurum_id,
            ...(await getUserPersonalStats(userId, kurum_id, busyVehicleIds))
        };
    }

    return data;
};

// ... getUserPersonalStats fonksiyonu aynı kalıyor ...
const getUserPersonalStats = async (userId, kurumId, busyVehicleIds) => {
    const [totalVehiclesInKurum, availableVehiclesInKurum, myActiveTripsCount, myTripHistory] = await Promise.all([
        Vehicle.count({ where: { kurum_id: kurumId } }),
        Vehicle.count({ where: { kurum_id: kurumId, is_active: true, id: { [Op.notIn]: busyVehicleIds } } }),
        Trip.count({ where: { user_id: userId, end_date: null } }),
        Trip.findAll({
            where: { user_id: userId, end_date: { [Op.not]: null } },
            include: [{ model: Vehicle, attributes: ['plate', 'brand', 'model'] }],
            order: [['end_date', 'DESC']],
            limit: 10
        })
    ]);

    return {
        stats: {
            kurum_total_vehicles: totalVehiclesInKurum,
            kurum_available_vehicles: availableVehiclesInKurum,
            my_active_assignments: myActiveTripsCount
        },
        history: myTripHistory
    };
};