import { Router } from 'express';
import { getTrains, getTrainByNumber } from '../controllers/trainController';

const router = Router();

router.route('/')
    .get(getTrains);

router.route('/:trainNumber')
    .get(getTrainByNumber);

export default router;
