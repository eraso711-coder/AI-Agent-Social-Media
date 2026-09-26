import { Router } from 'express';

import * as projectsController from './projects.controller.js';

const router = Router();

router.get('/', projectsController.getAllProjects);
router.get('/:id', projectsController.getProjectById);
router.post('/', projectsController.createProject);
router.put('/:id', projectsController.updateProject);
router.delete('/:id', projectsController.deleteProject);

export default router;