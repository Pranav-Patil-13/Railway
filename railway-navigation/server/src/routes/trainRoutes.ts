import { Router } from 'express';
import { getTrains, getTrainByNumber, searchRoutes, getLiveStatus, getReservationChart } from '../controllers/trainController';

const router = Router();

router.route('/')
    .get(getTrains);

router.route('/routes')
    .get(searchRoutes);

router.route('/:trainNumber')
    .get(getTrainByNumber);

router.route('/:trainNumber/live')
    .get(getLiveStatus);

router.route('/:trainNumber/charts')
    .get(getReservationChart);

export default router;
