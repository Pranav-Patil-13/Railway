import { Router } from 'express';
import { getTrains, getTrainByNumber, searchRoutes } from '../controllers/trainController';

const router = Router();

router.route('/')
    .get(getTrains);

router.route('/routes')
    .get(searchRoutes);

router.route('/:trainNumber')
    .get(getTrainByNumber);

export default router;
