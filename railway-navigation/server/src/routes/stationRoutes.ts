import { Router } from 'express';
import { searchStations } from '../controllers/stationController';

const router = Router();

router.route('/search')
    .get(searchStations);

export default router;
