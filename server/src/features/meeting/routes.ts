import { Router } from 'express';
import * as meetingController from './controller';
import { authenticate } from '../../shared/middlewares/authenticate';
import { validateRequest } from '../../shared/middlewares/validateRequest';
import { createMeetingSchema, joinMeetingSchema } from './validation';

const router = Router();

// Protect all meeting endpoints
router.use(authenticate);

router.post('/', validateRequest(createMeetingSchema), meetingController.createMeeting);
router.post('/join', validateRequest(joinMeetingSchema), meetingController.joinMeeting);

export default router;
