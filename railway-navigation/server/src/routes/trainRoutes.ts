import { Router } from 'express';
import { getTrains, getTrainByNumber, searchRoutes, getLiveStatus } from '../controllers/trainController';

const router = Router();

router.route('/')
    .get(getTrains);

router.route('/routes')
    .get(searchRoutes);

router.route('/:trainNumber')
    .get(getTrainByNumber);

router.route('/:trainNumber/live')
    .get(getLiveStatus);

export default router;
