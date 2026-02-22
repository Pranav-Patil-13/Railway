import { Router } from 'express';
import { searchStations, getStationByCode } from '../controllers/stationController';

const router = Router();

router.route('/search')
    .get(searchStations);

router.route('/:code')
    .get(getStationByCode);

export default router;
